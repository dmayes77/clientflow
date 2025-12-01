import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updatePackageSchema, validateRequest } from "@/lib/validations";
import { createSmartErrorResponse } from "@/lib/errors";

export async function PUT(request, { params }) {
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

    const body = await request.json();
    const { id } = await params;

    // Validate request body
    const validation = validateRequest(body, updatePackageSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const existingPackage = await prisma.package.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // If serviceIds are provided, update the package services
    if (validation.data.serviceIds) {
      // Delete existing package services
      await prisma.packageService.deleteMany({
        where: { packageId: id },
      });

      // Create new package services
      await prisma.packageService.createMany({
        data: validation.data.serviceIds.map((serviceId) => ({
          packageId: id,
          serviceId,
        })),
      });
    }

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        name: validation.data.name,
        description: validation.data.description || null,
        price: validation.data.price,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    // Flatten services for frontend compatibility
    const flattenedPackage = {
      ...updatedPackage,
      services: updatedPackage.services.map((ps) => ps.service),
    };

    return NextResponse.json(flattenedPackage);
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
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

    const existingPackage = await prisma.package.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    await prisma.package.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}
