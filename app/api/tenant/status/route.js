import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Subscription status constants
const ACTIVE_STATUSES = ["trialing", "active"];
const PAYMENT_FAILED_STATUSES = ["past_due", "unpaid", "incomplete"];
const CANCELED_STATUSES = ["canceled", "incomplete_expired"];
// Founders program plan type (bypasses Stripe requirement)
const FOUNDERS_PLAN = "founders";

export async function GET(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        id: true,
        subscriptionStatus: true,
        planType: true,
        setupComplete: true,
        stripeCustomerId: true,
        name: true,
        email: true,
      },
    });

    if (!tenant) {
      // Tenant doesn't exist yet - needs to complete signup
      return NextResponse.json({
        exists: false,
        subscriptionStatus: "pending",
        setupComplete: false,
        canAccessDashboard: false,
        redirectTo: "/onboarding/payment",
      });
    }

    const subscriptionStatus = tenant.subscriptionStatus || "pending";
    const setupComplete = tenant.setupComplete || false;
    const isFounder = tenant.planType === FOUNDERS_PLAN;

    // Determine access and redirect
    let canAccessDashboard = false;
    let redirectTo = null;

    // Founders have active status regardless of Stripe
    if (isFounder && ACTIVE_STATUSES.includes(subscriptionStatus)) {
      if (setupComplete) {
        canAccessDashboard = true;
      } else {
        redirectTo = "/onboarding/setup";
      }
    } else if (ACTIVE_STATUSES.includes(subscriptionStatus)) {
      if (setupComplete) {
        canAccessDashboard = true;
      } else {
        redirectTo = "/onboarding/setup";
      }
    } else if (!isFounder && (subscriptionStatus === "pending" || !tenant.stripeCustomerId)) {
      redirectTo = "/onboarding/payment";
    } else if (PAYMENT_FAILED_STATUSES.includes(subscriptionStatus)) {
      // Founders don't need payment method
      if (!isFounder) {
        redirectTo = "/account/payment-required";
      } else if (setupComplete) {
        canAccessDashboard = true;
      } else {
        redirectTo = "/onboarding/setup";
      }
    } else if (CANCELED_STATUSES.includes(subscriptionStatus)) {
      // Founders can't be canceled via Stripe, so this shouldn't happen
      if (!isFounder) {
        redirectTo = "/account/resubscribe";
      } else if (setupComplete) {
        canAccessDashboard = true;
      } else {
        redirectTo = "/onboarding/setup";
      }
    } else {
      // Unknown status - default to payment (but not for founders)
      if (!isFounder) {
        redirectTo = "/onboarding/payment";
      } else if (setupComplete) {
        canAccessDashboard = true;
      } else {
        redirectTo = "/onboarding/setup";
      }
    }

    return NextResponse.json({
      exists: true,
      subscriptionStatus,
      planType: tenant.planType,
      setupComplete,
      canAccessDashboard,
      redirectTo,
      hasPaymentMethod: !!tenant.stripeCustomerId,
      isFounder,
    });
  } catch (error) {
    console.error("Error fetching tenant status:", error);
    return NextResponse.json(
      { error: "Failed to fetch tenant status" },
      { status: 500 }
    );
  }
}
