import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

/**
 * POST /api/coupons/validate
 * Validate a coupon code for an invoice and calculate discount
 */
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { code, lineItems } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (!lineItems || !Array.isArray(lineItems)) {
      return NextResponse.json(
        { error: "Line items are required" },
        { status: 400 }
      );
    }

    // Find coupon (case-insensitive)
    const coupon = await prisma.coupon.findFirst({
      where: {
        tenantId: tenant.id,
        code: code.toUpperCase(),
      },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: "Coupon code not found",
      });
    }

    // Check if coupon is active
    if (!coupon.active) {
      return NextResponse.json({
        valid: false,
        error: "This coupon is no longer active",
      });
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: "This coupon has expired",
      });
    }

    // Check usage limits
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json({
        valid: false,
        error: "This coupon has reached its usage limit",
      });
    }

    // Filter eligible line items (exclude discounts)
    const regularItems = lineItems.filter((item) => !item.isDiscount);

    // Determine which items are eligible for the discount
    const hasServiceRestriction = coupon.applicableServiceIds && coupon.applicableServiceIds.length > 0;
    const hasPackageRestriction = coupon.applicablePackageIds && coupon.applicablePackageIds.length > 0;
    const hasAnyRestriction = hasServiceRestriction || hasPackageRestriction;

    let eligibleItems = regularItems;

    if (hasAnyRestriction) {
      eligibleItems = regularItems.filter((item) => {
        // Check if item matches service restriction
        if (item.serviceId && coupon.applicableServiceIds.includes(item.serviceId)) {
          return true;
        }
        // Check if item matches package restriction
        if (item.packageId && coupon.applicablePackageIds.includes(item.packageId)) {
          return true;
        }
        return false;
      });
    }

    // Check if there are any eligible items
    if (eligibleItems.length === 0) {
      return NextResponse.json({
        valid: false,
        error: hasAnyRestriction
          ? "This coupon is not applicable to any items in your invoice"
          : "No eligible items found in invoice",
      });
    }

    // Calculate eligible subtotal (in cents)
    const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      return sum + (item.amount || 0);
    }, 0);

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && eligibleSubtotal < coupon.minPurchaseAmount) {
      const minAmount = (coupon.minPurchaseAmount / 100).toFixed(2);
      return NextResponse.json({
        valid: false,
        error: `Minimum purchase of $${minAmount} required to use this coupon`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0; // in cents

    if (coupon.discountType === "percentage") {
      // Percentage discount
      discountAmount = Math.round((eligibleSubtotal * coupon.discountValue) / 100);
    } else {
      // Fixed dollar discount (discountValue is already in cents)
      discountAmount = coupon.discountValue;

      // Cap discount at eligible subtotal (can't discount more than total)
      if (discountAmount > eligibleSubtotal) {
        discountAmount = eligibleSubtotal;
      }
    }

    // Apply maximum discount cap if set
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }

    // Return validation result
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      calculation: {
        eligibleItemCount: eligibleItems.length,
        eligibleSubtotal: eligibleSubtotal,
        discountAmount: discountAmount,
        discountAmountDisplay: (discountAmount / 100).toFixed(2),
        eligibleItemIds: eligibleItems.map((item, index) => index), // Return indices of eligible items
      },
    });
  } catch (error) {
    console.error("[POST /api/coupons/validate] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
