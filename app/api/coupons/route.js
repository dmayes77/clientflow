import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createCouponSchema } from "@/lib/validations";

/**
 * GET /api/coupons
 * List all coupons for the authenticated tenant
 */
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const active = searchParams.get("active");

    const where = {
      tenantId: tenant.id,
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(active !== null && active !== undefined && {
        active: active === "true",
      }),
    };

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: [
        { active: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("[GET /api/coupons] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coupons
 * Create a new coupon
 */
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();

    // Validate request body
    const result = createCouponSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if code already exists for this tenant (case-insensitive)
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        tenantId: tenant.id,
        code: data.code,
      },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: `Coupon code "${data.code}" already exists` },
        { status: 400 }
      );
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

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: {
        tenantId: tenant.id,
        code: data.code,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        applicableServiceIds: data.applicableServiceIds || [],
        applicablePackageIds: data.applicablePackageIds || [],
        minPurchaseAmount: data.minPurchaseAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
        active: data.active ?? true,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("[POST /api/coupons] Error:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
