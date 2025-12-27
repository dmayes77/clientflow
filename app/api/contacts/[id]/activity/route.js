import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/contacts/[id]/activity - Get contact activity timeline
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact || contact.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Fetch all activity types in parallel
    const [bookings, invoices, payments, contactTags] = await Promise.all([
      // Bookings
      prisma.booking.findMany({
        where: { contactId: id },
        include: {
          service: { select: { name: true } },
          package: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Invoices
      prisma.invoice.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
      }),

      // Payments
      prisma.payment.findMany({
        where: { contactId: id },
        orderBy: { createdAt: "desc" },
      }),

      // Contact Tags (with tag details)
      prisma.contactTag.findMany({
        where: { contactId: id },
        include: { tag: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Transform data into timeline activities
    const activities = [];

    // Add contact created event
    activities.push({
      id: `contact-created-${contact.id}`,
      type: "contact_created",
      timestamp: contact.createdAt,
      data: {
        name: contact.name,
        email: contact.email,
        status: contact.status,
      },
    });

    // Add booking activities
    bookings.forEach((booking) => {
      activities.push({
        id: `booking-${booking.id}`,
        type: "booking_created",
        timestamp: booking.createdAt,
        data: {
          bookingId: booking.id,
          service: booking.service?.name || booking.package?.name || "Unknown Service",
          status: booking.status,
          scheduledAt: booking.scheduledAt,
          totalPrice: booking.totalPrice,
        },
      });

      // Add booking status change if updated
      if (booking.updatedAt > booking.createdAt) {
        activities.push({
          id: `booking-updated-${booking.id}`,
          type: "booking_updated",
          timestamp: booking.updatedAt,
          data: {
            bookingId: booking.id,
            service: booking.service?.name || booking.package?.name || "Unknown Service",
            status: booking.status,
          },
        });
      }
    });

    // Add invoice activities
    invoices.forEach((invoice) => {
      activities.push({
        id: `invoice-${invoice.id}`,
        type: "invoice_created",
        timestamp: invoice.createdAt,
        data: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.totalAmount,
          status: invoice.status,
        },
      });

      if (invoice.paidAt) {
        activities.push({
          id: `invoice-paid-${invoice.id}`,
          type: "invoice_paid",
          timestamp: invoice.paidAt,
          data: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount,
          },
        });
      }
    });

    // Add payment activities
    payments.forEach((payment) => {
      activities.push({
        id: `payment-${payment.id}`,
        type: "payment_received",
        timestamp: payment.createdAt,
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
        },
      });
    });

    // Add tag activities
    contactTags.forEach((ct) => {
      activities.push({
        id: `tag-${ct.id}`,
        type: "tag_added",
        timestamp: ct.createdAt,
        data: {
          tagId: ct.tagId,
          tagName: ct.tag.name,
          tagColor: ct.tag.color,
          tagType: ct.tag.type,
        },
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return NextResponse.json({
      contactId: contact.id,
      contactName: contact.name,
      activities,
      stats: {
        totalActivities: activities.length,
        totalBookings: bookings.length,
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        totalTags: contactTags.length,
      },
    });
  } catch (error) {
    console.error("Error fetching contact activity:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
