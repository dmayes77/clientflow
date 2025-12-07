import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createPackageSchema, validateRequest } from "@/lib/validations";

/**
 * Calculate package price from services with discount
 */
function calculatePackagePrice(services, discountPercent) {
  const totalServicePrice = services.reduce((sum, s) => sum + s.price, 0);
  const discountAmount = Math.round(totalServicePrice * (discountPercent / 100));
  return totalServicePrice - discountAmount;
}

/**
 * Transform package to include calculated values
 */
function transformPackage(pkg) {
  const services = pkg.services.map((ps) => ps.service);
  const totalServicePrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    discountPercent: pkg.discountPercent,
    active: pkg.active,
    createdAt: pkg.createdAt,
    updatedAt: pkg.updatedAt,
    categoryId: pkg.categoryId,
    category: pkg.category,
    // Calculated values
    price: pkg.price,
    originalPrice: totalServicePrice,
    savings: totalServicePrice - pkg.price,
    totalDuration,
    // Related data
    services,
    serviceCount: services.length,
    bookingCount: pkg._count?.bookings ?? 0,
  };
}

// GET /api/packages - List all packages
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const categoryId = searchParams.get("categoryId");

    const where = {
      tenantId: tenant.id,
      ...(activeOnly && { active: true }),
      ...(categoryId && { categoryId }),
    };

    const packages = await prisma.package.findMany({
      where,
      include: {
        category: true,
        services: {
          include: {
            service: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transformedPackages = packages.map(transformPackage);

    return NextResponse.json(transformedPackages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/packages - Create a new package
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createPackageSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Fetch services to verify they belong to tenant and get prices
    const services = await prisma.service.findMany({
      where: {
        id: { in: data.serviceIds },
        tenantId: tenant.id,
      },
    });

    if (services.length !== data.serviceIds.length) {
      return NextResponse.json({ error: "One or more services not found" }, { status: 404 });
    }

    // Handle newCategoryName - create category if it doesn't exist
    let categoryId = data.categoryId;
    if (data.newCategoryName && !categoryId) {
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

    // Calculate the discounted price or use override
    const calculatedPrice = calculatePackagePrice(services, data.discountPercent);
    const price = data.overridePrice ?? calculatedPrice;

    // Create package with services through junction table
    const pkg = await prisma.package.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        description: data.description,
        price,
        discountPercent: data.discountPercent,
        active: data.active ?? true,
        categoryId,
        services: {
          create: data.serviceIds.map((serviceId) => ({
            serviceId,
          })),
        },
      },
      include: {
        category: true,
        services: {
          include: {
            service: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    return NextResponse.json(transformPackage(pkg), { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
