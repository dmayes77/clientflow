import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateServiceSchema, validateRequest } from "@/lib/validations";

// GET /api/services/[id] - Get a single service
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        category: true,
        images: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Recalculate and update prices for all packages containing a service
 */
async function recalculatePackagePrices(serviceId) {
  // Find all packages that include this service
  const packageServices = await prisma.packageService.findMany({
    where: { serviceId },
    select: { packageId: true },
  });

  const packageIds = packageServices.map((ps) => ps.packageId);
  if (packageIds.length === 0) return;

  // For each package, recalculate the price
  for (const packageId of packageIds) {
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    if (pkg) {
      const totalServicePrice = pkg.services.reduce((sum, ps) => sum + ps.service.price, 0);
      const discountAmount = Math.round(totalServicePrice * (pkg.discountPercent / 100));
      const newPrice = totalServicePrice - discountAmount;

      await prisma.package.update({
        where: { id: packageId },
        data: { price: newPrice },
      });
    }
  }
}

// PATCH /api/services/[id] - Update a service
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingService = await prisma.service.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, updateServiceSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
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

    // Remove newCategoryName and imageId from update data
    const { newCategoryName, imageId, ...updateData } = data;
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
      },
    });

    // If price changed, recalculate all package prices that include this service
    if (data.price !== undefined && data.price !== existingService.price) {
      await recalculatePackagePrices(id);
    }

    // Handle image linking
    if (imageId !== undefined) {
      // First, unlink any existing images from this service
      await prisma.image.updateMany({
        where: { serviceId: id },
        data: { serviceId: null },
      });

      // If a new imageId is provided, link it
      if (imageId) {
        await prisma.image.update({
          where: { id: imageId },
          data: { serviceId: id },
        });
      }

      // Refetch service with updated images
      const updatedService = await prisma.service.findUnique({
        where: { id },
        include: {
          category: true,
          images: true,
        },
      });
      return NextResponse.json(updatedService);
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/services/[id] - Delete a service
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingService = await prisma.service.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
