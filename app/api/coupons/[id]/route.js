import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateCouponSchema } from "@/lib/validations";

/**
 * GET /api/coupons/[id]
 * Get a single coupon by ID
 */
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("[GET /api/coupons/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/coupons/[id]
 * Update a coupon
 */
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const result = updateCouponSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if coupon exists and belongs to tenant
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    // If code is being changed, check for conflicts (case-insensitive)
    if (data.code && data.code !== existingCoupon.code) {
      const codeConflict = await prisma.coupon.findFirst({
        where: {
          tenantId: tenant.id,
          code: data.code,
          id: { not: id },
        },
      });

      if (codeConflict) {
        return NextResponse.json(
          { error: `Coupon code "${data.code}" already exists` },
          { status: 400 }
        );
      }
    }

    // Verify that service and package IDs belong to this tenant
    if (data.applicableServiceIds && data.applicableServiceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: {
          id: { in: data.applicableServiceIds },
          tenantId: tenant.id,
        },
      });

      if (services.length !== data.applicableServiceIds.length) {
        return NextResponse.json(
          { error: "One or more service IDs are invalid" },
          { status: 400 }
        );
      }
    }

    if (data.applicablePackageIds && data.applicablePackageIds.length > 0) {
      const packages = await prisma.package.findMany({
        where: {
          id: { in: data.applicablePackageIds },
          tenantId: tenant.id,
        },
      });

      if (packages.length !== data.applicablePackageIds.length) {
        return NextResponse.json(
          { error: "One or more package IDs are invalid" },
          { status: 400 }
        );
      }
    }

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.discountType && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.applicableServiceIds !== undefined && { applicableServiceIds: data.applicableServiceIds }),
        ...(data.applicablePackageIds !== undefined && { applicablePackageIds: data.applicablePackageIds }),
        ...(data.minPurchaseAmount !== undefined && { minPurchaseAmount: data.minPurchaseAmount }),
        ...(data.maxDiscountAmount !== undefined && { maxDiscountAmount: data.maxDiscountAmount }),
        ...(data.maxUses !== undefined && { maxUses: data.maxUses }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("[PATCH /api/coupons/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coupons/[id]
 * Delete a coupon (prevent if used in invoices)
 */
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Check if coupon exists and belongs to tenant
    const coupon = await prisma.coupon.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        invoices: {
          take: 1, // Just check if any exist
        },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if coupon has been used
    if (coupon.invoices.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete coupon that has been used in invoices. Consider deactivating it instead.",
          suggestion: "deactivate"
        },
        { status: 400 }
      );
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/coupons/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
