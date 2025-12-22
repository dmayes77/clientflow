import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createBookingSchema, validateRequest } from "@/lib/validations";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { checkBookingLimit } from "@/lib/plan-limits";

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
    const from = searchParams.get("from");
    const to = searchParams.get("to");

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
          select: { id: true },
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

    const booking = await prisma.booking.create({
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

    // Auto-tag contact based on booking status
    const bookingStatus = data.status || "inquiry";
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
