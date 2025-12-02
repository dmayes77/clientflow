import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";

// GET /api/tags/[id] - Get a single tag
export async function GET(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;

    const tag = await prisma.tag.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                type: true,
              },
            },
          },
        },
        workflows: {
          select: {
            id: true,
            name: true,
            active: true,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/tags/[id] - Update a tag
export async function PUT(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, color, description } = body;

    const existingTag = await prisma.tag.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim().toLowerCase() !== existingTag.name) {
      const duplicateTag = await prisma.tag.findFirst({
        where: {
          tenantId: tenant.id,
          name: name.trim().toLowerCase(),
          NOT: { id },
        },
      });

      if (duplicateTag) {
        return NextResponse.json(
          { error: "A tag with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        name: name ? name.trim().toLowerCase() : existingTag.name,
        color: color || existingTag.color,
        description: description !== undefined ? description : existingTag.description,
      },
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;

    const tag = await prisma.tag.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
