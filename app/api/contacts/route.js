import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createContactSchema, validateRequest } from "@/lib/validations";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { checkContactLimit } from "@/lib/plan-limits";

// GET /api/contacts - List all contacts with advanced filtering
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const statusFilter = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minBookings = searchParams.get("minBookings");
    const maxBookings = searchParams.get("maxBookings");

    // Build where clause
    const where = {
      tenantId: tenant.id,
      ...(includeArchived ? {} : { archived: false }),
    };

    // Search filter (name, email, phone, company)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { company: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (statusFilter) {
      where.status = statusFilter;
    }

    // Tag filter
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const contacts = await prisma.contact.findMany({
      where,
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

    // Filter by booking count if specified (post-query filtering)
    let filteredContacts = contacts;
    if (minBookings || maxBookings) {
      filteredContacts = contacts.filter((contact) => {
        const count = contact._count.bookings;
        if (minBookings && count < parseInt(minBookings)) return false;
        if (maxBookings && count > parseInt(maxBookings)) return false;
        return true;
      });
    }

    // Transform to include booking count and flatten tags
    const contactsWithStats = filteredContacts.map((contact) => ({
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

    // Check plan limits
    const limitCheck = await checkContactLimit(tenant.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message, code: "LIMIT_REACHED", limit: limitCheck.limit, current: limitCheck.current },
        { status: 403 }
      );
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
    console.error("[API] Error creating contact:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
