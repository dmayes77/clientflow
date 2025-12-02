import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/categories/[id] - Get a single category
export async function GET(request, { params }) {
  try {
    const { orgId } = await auth();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        services: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(request, { params }) {
  try {
    const { orgId } = await auth();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify ownership
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, active, order } = body;

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
        ...(order !== undefined && { order }),
      },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(request, { params }) {
  try {
    const { orgId } = await auth();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify ownership
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Delete the category (services will have categoryId set to null due to onDelete: SetNull)
    await prisma.serviceCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
