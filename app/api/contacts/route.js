import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createContactSchema, validateRequest } from "@/lib/validations";
import { triggerWorkflows } from "@/lib/workflow-executor";

// GET /api/contacts - List all contacts
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const contacts = await prisma.contact.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: { bookings: true },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to include booking count and flatten tags
    const contactsWithStats = contacts.map((contact) => ({
      ...contact,
      bookingCount: contact._count.bookings,
      tags: contact.tags.map((ct) => ct.tag),
      _count: undefined,
    }));

    return NextResponse.json(contactsWithStats);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createContactSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      },
    });

    // Trigger lead_created workflows (async, don't wait)
    triggerWorkflows("lead_created", {
      tenant,
      contact,
    }).catch((err) => {
      console.error("Error triggering workflows:", err);
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
