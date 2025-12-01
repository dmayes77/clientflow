import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get the current org
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get the tenant, or create one if it doesn't exist (for local dev without webhooks)
    let tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      // Create tenant if it doesn't exist (webhook may not have fired in local dev)
      tenant = await prisma.tenant.create({
        data: {
          name: "New Business",
          email: "",
          clerkOrgId: orgId,
          subscriptionStatus: "pending",
          planType: null,
          setupComplete: false,
        },
      });
      console.log(`Created tenant ${tenant.id} for org ${orgId} during checkout verification`);
    }

    // If tenant already has active subscription, no need to verify
    if (tenant.subscriptionStatus === "active" || tenant.subscriptionStatus === "trialing") {
      return NextResponse.json({ success: true, status: tenant.subscriptionStatus });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    // Verify the session is complete
    if (session.status !== "complete") {
      return NextResponse.json(
        { error: "Checkout session not complete" },
        { status: 400 }
      );
    }

    // Get subscription details
    const subscription = session.subscription;
    const customer = session.customer;

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found in session" },
        { status: 400 }
      );
    }

    // Update the tenant with Stripe info
    const subscriptionData = typeof subscription === "string"
      ? await stripe.subscriptions.retrieve(subscription)
      : subscription;

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeCustomerId: typeof customer === "string" ? customer : customer.id,
        stripeSubscriptionId: typeof subscription === "string" ? subscription : subscription.id,
        subscriptionStatus: subscriptionData.status,
        planType: subscriptionData.metadata?.planType || "professional",
        currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      status: subscriptionData.status,
    });
  } catch (error) {
    console.error("Error verifying checkout:", error);
    return NextResponse.json(
      { error: "Failed to verify checkout", details: error.message },
      { status: 500 }
    );
  }
}
