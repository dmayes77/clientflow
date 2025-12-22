import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createContactSchema, validateRequest } from "@/lib/validations";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { checkContactLimit } from "@/lib/plan-limits";

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
  console.log("[API] POST /api/contacts - Request received");

  try {
    console.log("[API] Authenticating tenant...");
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      console.log("[API] Authentication failed:", error, status);
      return NextResponse.json({ error }, { status });
    }
    console.log("[API] Authenticated tenant:", tenant.id);

    // Check plan limits
    const limitCheck = await checkContactLimit(tenant.id);
    if (!limitCheck.allowed) {
      console.log("[API] Contact limit reached:", limitCheck);
      return NextResponse.json(
        { error: limitCheck.message, code: "LIMIT_REACHED", limit: limitCheck.limit, current: limitCheck.current },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("[API] Request body:", JSON.stringify(body));

    const { success, data, errors } = validateRequest(body, createContactSchema);

    if (!success) {
      console.log("[API] Validation failed:", errors);
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }
    console.log("[API] Validation passed, creating contact...");

    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      },
    });
    console.log("[API] Contact created:", contact.id);

    // Trigger lead_created workflows (async, don't wait)
    triggerWorkflows("lead_created", {
      tenant,
      contact,
    }).catch((err) => {
      console.error("Error triggering workflows:", err);
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("[API] Error creating contact:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
