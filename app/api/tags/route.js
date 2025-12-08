import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/tags - List all tags
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where = {
      tenantId: tenant.id,
      ...(type && type !== "all" && { type }),
    };

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            clients: true,
            invoices: true,
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Valid tag types
const TAG_TYPES = ["general", "contact", "invoice", "booking"];

// POST /api/tags - Create a new tag
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { name, color, description, type } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Tag name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Validate tag type
    const tagType = type && TAG_TYPES.includes(type) ? type : "general";

    // Check for duplicate tag name
    const existingTag = await prisma.tag.findUnique({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: name.trim(),
        },
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        color: color || "blue",
        description: description || null,
        type: tagType,
      },
      include: {
        _count: {
          select: {
            clients: true,
            invoices: true,
            bookings: true,
          },
        },
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
