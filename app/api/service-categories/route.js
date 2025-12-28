import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  description: z.string().max(500).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

// GET /api/service-categories - List all categories
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const categories = await prisma.serviceCategory.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: {
            services: true,
            packages: true,
          },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" },
      ],
    });

    const categoriesWithCounts = categories.map((cat) => ({
      ...cat,
      serviceCount: cat._count.services,
      packageCount: cat._count.packages,
      _count: undefined,
    }));

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/service-categories - Create a new category
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, description, color } = result.data;

    // Check if category with same name already exists
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        tenantId: tenant.id,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Category with this name already exists" }, { status: 409 });
    }

    const category = await prisma.serviceCategory.create({
      data: {
        tenantId: tenant.id,
        name,
        description,
        color,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
