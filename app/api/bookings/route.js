import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createBookingSchema, validateRequest } from "@/lib/validations";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { checkBookingLimit } from "@/lib/plan-limits";
import { calculateAdjustedEndTime } from "@/lib/utils/schedule";
import { applyBookingStatusTag } from "@/lib/system-tags";

// GET /api/bookings - List all bookings
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const statusFilter = searchParams.get("status");
    // Support both from/to and startDate/endDate parameter names
    const from = searchParams.get("from") || searchParams.get("startDate");
    const to = searchParams.get("to") || searchParams.get("endDate");

    const where = {
      tenantId: tenant.id,
      ...(contactId && { contactId }),
      ...(statusFilter && { status: statusFilter }),
      ...(from || to
        ? {
            scheduledAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        contact: true,
        service: true,
        package: true,
        services: {
          include: { service: true },
        },
        packages: {
          include: { package: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, status: true, total: true },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check plan limits
    const limitCheck = await checkBookingLimit(tenant.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message, code: "LIMIT_REACHED", limit: limitCheck.limit, current: limitCheck.current },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createBookingSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: {
        id: data.contactId,
        tenantId: tenant.id,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify service/package if provided
    if (data.serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: data.serviceId,
          tenantId: tenant.id,
        },
      });

      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
    }

    if (data.packageId) {
      const pkg = await prisma.package.findFirst({
        where: {
          id: data.packageId,
          tenantId: tenant.id,
        },
      });

      if (!pkg) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }
    }

    // Use a transaction to prevent race conditions between conflict check and booking creation
    const booking = await prisma.$transaction(async (tx) => {
      // Check for conflicting bookings (including buffer time and break periods)
      if (data.scheduledAt && data.duration) {
        const appointmentStart = new Date(data.scheduledAt);

        // Calculate adjusted end time accounting for break period
        const appointmentEnd = calculateAdjustedEndTime(
          appointmentStart,
          data.duration,
          tenant.breakStartTime,
          tenant.breakEndTime
        );

        // Buffer time should only be added ONCE between appointments, not doubled
        // We add it to the end of THIS appointment when checking conflicts
        const bufferTimeMs = (tenant.bufferTime || 0) * 60000;
        const checkStart = appointmentStart;
        const checkEnd = new Date(appointmentEnd.getTime() + bufferTimeMs);

        const conflictingBooking = await tx.booking.findFirst({
          where: {
            tenantId: tenant.id,
            status: { in: ["pending", "confirmed", "inquiry", "scheduled"] },
            AND: [
              {
                scheduledAt: { lt: checkEnd },
              },
              {
                scheduledAt: { gte: new Date(checkStart.getTime() - 24 * 60 * 60000) },
              },
            ],
          },
          select: {
            id: true,
            scheduledAt: true,
            duration: true,
          },
        });

        if (conflictingBooking) {
          const existingStart = conflictingBooking.scheduledAt;

          // Calculate adjusted end time for existing booking (accounting for break period)
          const existingEnd = calculateAdjustedEndTime(
            existingStart,
            conflictingBooking.duration,
            tenant.breakStartTime,
            tenant.breakEndTime
          );

          // Add buffer time only once - to the end of the existing booking
          const existingCheckEnd = new Date(existingEnd.getTime() + bufferTimeMs);

          // Check if appointments overlap
          // New booking starts before existing ends (with buffer) AND new booking ends after existing starts
          if (checkStart < existingCheckEnd && checkEnd > existingStart) {
            throw new Error("CONFLICT:This time slot conflicts with an existing booking. Please choose a different time.");
          }
        }
      }

      // Create the booking
      return await tx.booking.create({
        data: {
          tenantId: tenant.id,
          contactId: data.contactId,
          serviceId: data.serviceId,
          packageId: data.packageId,
          scheduledAt: data.scheduledAt,
          status: data.status || "inquiry",
          notes: data.notes,
          totalPrice: data.totalPrice,
          duration: data.duration,
        },
        include: {
          contact: true,
          service: true,
          package: true,
        },
      });
    });

    // Apply booking status tag
    const bookingStatus = data.status || "inquiry";
    await applyBookingStatusTag(prisma, booking.id, tenant.id, bookingStatus);

    // Auto-tag contact based on booking status
    if (bookingStatus === "inquiry" || bookingStatus === "scheduled") {
      const tagName = bookingStatus === "inquiry" ? "Lead" : "Client";

      // Find or create the tag using upsert to avoid race conditions
      const tag = await prisma.tag.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: tagName } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: tagName,
          type: "contact",
          color: tagName === "Lead" ? "#f59e0b" : "#22c55e",
        },
      });

      // Check if contact already has this tag
      const existingContactTag = await prisma.contactTag.findUnique({
        where: {
          contactId_tagId: { contactId: data.contactId, tagId: tag.id },
        },
      });

      if (!existingContactTag) {
        await prisma.contactTag.create({
          data: { contactId: data.contactId, tagId: tag.id },
        });
      }
    }

    // Trigger booking_created workflows (async, don't wait)
    triggerWorkflows("booking_created", {
      tenant,
      contact: booking.contact,
      booking,
    }).catch((err) => {
      console.error("Error triggering workflows:", err);
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);

    // Handle conflict errors specifically
    if (error.message?.startsWith("CONFLICT:")) {
      return NextResponse.json(
        { error: error.message.replace("CONFLICT:", "") },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
