import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateBookingSchema, validateRequest } from "@/lib/validations";
import { applyBookingStatusTag } from "@/lib/system-tags";
import { triggerWorkflows } from "@/lib/workflow-executor";

// GET /api/bookings/[id] - Get a single booking
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Fetch booking with tags, services, packages and all available data
    const [booking, allTags, allServices, allPackages] = await Promise.all([
      prisma.booking.findFirst({
        where: {
          id,
          tenantId: tenant.id,
        },
        include: {
          contact: true,
          service: true,
          package: true,
          invoice: true,
          tags: {
            include: {
              tag: true,
            },
          },
          services: {
            include: {
              service: true,
            },
          },
          packages: {
            include: {
              package: true,
            },
          },
        },
      }),
      prisma.tag.findMany({
        where: {
          tenantId: tenant.id,
          type: { in: ["general", "booking"] },
        },
        orderBy: { name: "asc" },
      }),
      prisma.service.findMany({
        where: { tenantId: tenant.id, active: true },
        orderBy: { name: "asc" },
      }),
      prisma.package.findMany({
        where: { tenantId: tenant.id, active: true },
        orderBy: { name: "asc" },
      }),
    ]);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Transform to simpler formats
    const bookingTags = booking.tags.map((bt) => bt.tag);

    // Use many-to-many relations if they exist, otherwise fall back to legacy single relations
    const selectedServices = booking.services.length > 0
      ? booking.services.map((bs) => ({
          ...bs.service,
          quantity: bs.quantity,
        }))
      : (booking.service ? [{ ...booking.service, quantity: 1 }] : []);

    const selectedPackages = booking.packages.length > 0
      ? booking.packages.map((bp) => ({
          ...bp.package,
          quantity: bp.quantity,
        }))
      : (booking.package ? [{ ...booking.package, quantity: 1 }] : []);
    const bookingWithData = {
      ...booking,
      tags: bookingTags,
      selectedServices,
      selectedPackages,
    };

    return NextResponse.json({
      booking: bookingWithData,
      allTags,
      allServices,
      allPackages
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] - Update a booking
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        invoice: true,
        service: true,
        package: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, updateBookingSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Check if price or service/package changed
    const priceChanged = data.totalPrice !== undefined && data.totalPrice !== existingBooking.totalPrice;
    const serviceChanged = data.serviceId !== undefined && data.serviceId !== existingBooking.serviceId;
    const packageChanged = data.packageId !== undefined && data.packageId !== existingBooking.packageId;

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        contact: true,
        service: true,
        package: true,
        invoice: true,
      },
    });

    // Apply booking status tag and trigger workflows if status changed
    if (data.status && data.status !== existingBooking.status) {
      await applyBookingStatusTag(prisma, booking.id, tenant.id, data.status);

      // Trigger booking_completed workflow
      if (data.status === "completed") {
        triggerWorkflows("booking_completed", {
          tenant,
          booking,
          contact: booking.contact,
        }).catch((err) => {
          console.error("Error triggering booking_completed workflow:", err);
        });
      }

      // Trigger booking_cancelled workflow
      if (data.status === "cancelled") {
        triggerWorkflows("booking_cancelled", {
          tenant,
          booking,
          contact: booking.contact,
        }).catch((err) => {
          console.error("Error triggering booking_cancelled workflow:", err);
        });
      }
    }

    // Auto-tag contact based on booking status change
    if (data.status && (data.status === "inquiry" || data.status === "scheduled")) {
      const tagName = data.status === "inquiry" ? "Lead" : "Client";

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
          contactId_tagId: { contactId: booking.contactId, tagId: tag.id },
        },
      });

      if (!existingContactTag) {
        await prisma.contactTag.create({
          data: { contactId: booking.contactId, tagId: tag.id },
        });
      }
    }

    // Auto-update linked invoice if price or service/package changed and invoice is still in draft
    if (existingBooking.invoice && existingBooking.invoice.status === "draft" && (priceChanged || serviceChanged || packageChanged)) {
      const newPrice = data.totalPrice ?? existingBooking.totalPrice;
      const itemName = booking.service?.name || booking.package?.name || "Service";

      await prisma.invoice.update({
        where: { id: existingBooking.invoice.id },
        data: {
          subtotal: newPrice,
          total: newPrice + (existingBooking.invoice.taxAmount || 0),
          lineItems: [
            {
              description: itemName,
              quantity: 1,
              unitPrice: newPrice,
              amount: newPrice,
            },
          ],
        },
      });

      // Re-fetch booking with updated invoice
      const updatedBooking = await prisma.booking.findFirst({
        where: { id },
        include: {
          contact: true,
          service: true,
          package: true,
          invoice: true,
        },
      });

      return NextResponse.json(updatedBooking);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings/[id] - Delete a booking
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingBooking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
