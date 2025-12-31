import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updatePackageSchema, validateRequest } from "@/lib/validations";

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
    includes: pkg.includes || [],
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

// GET /api/packages/[id] - Get a single package
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const pkg = await prisma.package.findFirst({
      where: {
        id,
        tenantId: tenant.id,
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

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(transformPackage(pkg));
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/packages/[id] - Update a package
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingPackage = await prisma.package.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, updatePackageSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Determine which services to use for price calculation
    let services;
    let serviceIds = data.serviceIds;

    if (serviceIds) {
      // Verify new services belong to tenant
      services = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          tenantId: tenant.id,
        },
      });

      if (services.length !== serviceIds.length) {
        return NextResponse.json({ error: "One or more services not found" }, { status: 404 });
      }
    } else {
      // Use existing services
      services = existingPackage.services.map((ps) => ps.service);
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

    // Calculate new price if discount or services changed, or use override
    const discountPercent = data.discountPercent ?? existingPackage.discountPercent;
    const calculatedPrice = calculatePackagePrice(services, discountPercent);
    const price = data.overridePrice ?? calculatedPrice;

    // Build update data
    const updateData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.discountPercent !== undefined && { discountPercent: data.discountPercent }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.includes !== undefined && { includes: data.includes }),
      ...(categoryId !== undefined && { categoryId }),
      price, // Use override price or calculated price
    };

    // Handle service updates through junction table
    if (serviceIds) {
      // Delete existing junction records
      await prisma.packageService.deleteMany({
        where: { packageId: id },
      });

      // Create new junction records
      updateData.services = {
        create: serviceIds.map((serviceId) => ({
          serviceId,
        })),
      };
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(transformPackage(pkg));
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/packages/[id] - Delete a package
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingPackage = await prisma.package.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Check if package has bookings
    if (existingPackage._count.bookings > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete package with existing bookings. Consider archiving it instead.",
          canArchive: true,
        },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
