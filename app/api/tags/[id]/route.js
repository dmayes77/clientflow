import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// Valid tag types
const TAG_TYPES = ["general", "contact", "invoice", "booking"];

// GET /api/tags/[id] - Get a single tag
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const tag = await prisma.tag.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        _count: {
          select: {
            clients: true,
            invoices: true,
            bookings: true,
          },
        },
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        invoices: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                clientName: true,
                total: true,
                status: true,
              },
            },
          },
        },
        bookings: {
          include: {
            booking: {
              select: {
                id: true,
                scheduledAt: true,
                status: true,
                totalPrice: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/tags/[id] - Update a tag
export async function PUT(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
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
    const tagType = type && TAG_TYPES.includes(type) ? type : existingTag.type;

    // Check for duplicate tag name (excluding current tag)
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        tenantId: tenant.id,
        name: name.trim(),
        NOT: { id },
      },
    });

    if (duplicateTag) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
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

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
