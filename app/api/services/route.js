import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createServiceSchema, validateRequest } from "@/lib/validations";
import { checkServiceLimit } from "@/lib/plan-limits";

// GET /api/services - List all services
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const activeOnly = searchParams.get("active") === "true";

    const where = {
      tenantId: tenant.id,
      ...(categoryId && { categoryId }),
      ...(activeOnly && { active: true }),
    };

    const services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        images: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/services - Create a new service
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check plan limits
    const limitCheck = await checkServiceLimit(tenant.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message, code: "LIMIT_REACHED", limit: limitCheck.limit, current: limitCheck.current },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createServiceSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    let categoryId = data.categoryId;

    // If newCategoryName is provided, create the category first
    if (data.newCategoryName && !categoryId) {
      // Check if category already exists
      const existingCategory = await prisma.serviceCategory.findFirst({
        where: {
          tenantId: tenant.id,
          name: { equals: data.newCategoryName, mode: "insensitive" },
        },
      });

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCategory = await prisma.serviceCategory.create({
          data: {
            tenantId: tenant.id,
            name: data.newCategoryName,
          },
        });
        categoryId = newCategory.id;
      }
    }

    const service = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        active: data.active ?? true,
        categoryId,
        includes: data.includes || [],
      },
      include: {
        category: true,
        images: true,
      },
    });

    // If imageId is provided, link the image to this service
    if (data.imageId) {
      await prisma.image.update({
        where: { id: data.imageId },
        data: { serviceId: service.id },
      });
      // Refetch service to include the linked image
      const updatedService = await prisma.service.findUnique({
        where: { id: service.id },
        include: {
          category: true,
          images: true,
        },
      });
      return NextResponse.json(updatedService, { status: 201 });
    }

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
