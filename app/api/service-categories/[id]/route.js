import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters").optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  active: z.boolean().optional(),
});

// GET /api/service-categories/[id] - Get a single category
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const category = await prisma.serviceCategory.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        _count: {
          select: {
            services: true,
            packages: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const categoryWithCounts = {
      ...category,
      serviceCount: category._count.services,
      packageCount: category._count.packages,
      _count: undefined,
    };

    return NextResponse.json(categoryWithCounts);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/service-categories/[id] - Update a category
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Check if category exists and belongs to tenant
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, color, icon, active } = result.data;

    // If name is being changed, check for duplicates
    if (name && name !== existingCategory.name) {
      const duplicate = await prisma.serviceCategory.findFirst({
        where: {
          tenantId: tenant.id,
          name: { equals: name, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Category with this name already exists" },
          { status: 409 }
        );
      }
    }

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/service-categories/[id] - Delete a category
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Check if category exists and belongs to tenant
    const category = await prisma.serviceCategory.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        _count: {
          select: {
            services: true,
            packages: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Don't allow deleting categories that have services or packages
    if (category._count.services > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with services",
          details: `This category has ${category._count.services} service(s). Please reassign or delete them first.`
        },
        { status: 400 }
      );
    }

    if (category._count.packages > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with packages",
          details: `This category has ${category._count.packages} package(s). Please reassign or delete them first.`
        },
        { status: 400 }
      );
    }

    await prisma.serviceCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
