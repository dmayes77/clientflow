import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateContactSchema, validateRequest } from "@/lib/validations";
import { triggerWorkflows } from "@/lib/workflow-executor";

// GET /api/contacts/[id] - Get a single contact with bookings and stats
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const [contact, allTags] = await Promise.all([
      prisma.contact.findFirst({
        where: {
          id,
          tenantId: tenant.id,
        },
        include: {
          bookings: {
            include: {
              service: { select: { name: true } },
              package: { select: { name: true } },
              invoice: { select: { id: true } },
              services: {
                include: {
                  service: { select: { name: true } },
                },
              },
              packages: {
                include: {
                  package: { select: { name: true } },
                },
              },
            },
            orderBy: { scheduledAt: "desc" },
          },
          invoices: {
            orderBy: { createdAt: "desc" },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.tag.findMany({
        where: {
          tenantId: tenant.id,
          type: { in: ["general", "contact"] },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Transform tags to simpler format
    const contactTags = contact.tags.map((ct) => ct.tag);
    const contactWithTags = { ...contact, tags: contactTags };

    // Calculate stats
    const now = new Date();
    const totalBookings = contact.bookings.length;
    const completedBookings = contact.bookings.filter((b) => b.status === "completed").length;
    const upcomingBookings = contact.bookings.filter(
      (b) => new Date(b.scheduledAt) > now && !["completed", "cancelled"].includes(b.status)
    ).length;
    const totalSpent = contact.bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const stats = {
      totalBookings,
      completedBookings,
      upcomingBookings,
      totalSpent,
    };

    return NextResponse.json({ contact: contactWithTags, stats, allTags });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/contacts/[id] - Update a contact
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, updateContactSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Check for duplicate email if email is being changed
    if (data.email && data.email !== existingContact.email) {
      const existingByEmail = await prisma.contact.findFirst({
        where: {
          tenantId: tenant.id,
          email: data.email,
          archived: false,
          id: { not: id },
        },
      });

      if (existingByEmail) {
        return NextResponse.json(
          { error: `A contact with email "${data.email}" already exists`, field: "email", duplicate: true },
          { status: 409 }
        );
      }
    }

    // Check for duplicate phone if phone is being changed
    if (data.phone && data.phone !== existingContact.phone) {
      const existingByPhone = await prisma.contact.findFirst({
        where: {
          tenantId: tenant.id,
          phone: data.phone,
          archived: false,
          id: { not: id },
        },
      });

      if (existingByPhone) {
        return NextResponse.json(
          { error: `A contact with phone number "${data.phone}" already exists`, field: "phone", duplicate: true },
          { status: 409 }
        );
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data,
    });

    // Check if contact was converted from lead/prospect to active
    const wasLead = ["lead", "prospect"].includes(existingContact.status);
    const isNowActive = data.status === "active";

    if (wasLead && isNowActive) {
      // Trigger contact_converted workflows (async, don't wait)
      triggerWorkflows("contact_converted", {
        tenant,
        contact,
      }).catch((err) => {
        console.error("Error triggering contact_converted workflows:", err);
      });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        bookings: {
          where: { status: "completed" },
          select: { id: true },
        },
        invoices: {
          where: { status: "paid" },
          select: { id: true },
        },
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Prevent deletion if contact has completed bookings or paid invoices
    const hasCompletedBookings = existingContact.bookings.length > 0;
    const hasPaidInvoices = existingContact.invoices.length > 0;

    if (hasCompletedBookings || hasPaidInvoices) {
      const reasons = [];
      if (hasCompletedBookings) reasons.push(`${existingContact.bookings.length} completed booking(s)`);
      if (hasPaidInvoices) reasons.push(`${existingContact.invoices.length} paid invoice(s)`);

      return NextResponse.json(
        {
          error: `Cannot delete contact with ${reasons.join(" and ")}. Delete incomplete bookings and unpaid invoices first.`,
          hasCompletedBookings,
          hasPaidInvoices,
        },
        { status: 400 }
      );
    }

    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
