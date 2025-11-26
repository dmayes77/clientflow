import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get tenant by Clerk organization ID
    const tenant = await prisma.tenant.findFirst({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    if (!tenant.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: tenant.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: tenant.stripeCustomerId,
        status: "trialing",
        limit: 1,
      });

      if (trialingSubscriptions.data.length === 0) {
        return NextResponse.json(
          { error: "No active subscription found" },
          { status: 404 }
        );
      }

      // Cancel trialing subscription at period end
      const subscription = trialingSubscriptions.data[0];
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      return NextResponse.json({
        success: true,
        message: "Subscription will be canceled at the end of your trial period.",
        effectiveDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
      });
    }

    // Cancel at the end of the billing period
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of your billing period. You'll keep access until then.",
      effectiveDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
