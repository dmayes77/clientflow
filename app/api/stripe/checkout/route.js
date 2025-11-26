import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  try {
    const { orgId } = await auth();
    const user = await currentUser();

    if (!orgId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, planType } = body;

    if (!priceId || !planType) {
      return NextResponse.json(
        { error: "Price ID and plan type are required" },
        { status: 400 }
      );
    }

    // Get or create tenant
    let tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Create or retrieve Stripe customer
    let customerId = tenant.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.emailAddresses[0]?.emailAddress,
        name: tenant.name,
        metadata: {
          tenantId: tenant.id,
          clerkOrgId: orgId,
        },
      });

      customerId = customer.id;

      // Update tenant with customer ID
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Checkout Session with trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          tenantId: tenant.id,
          clerkOrgId: orgId,
          planType: planType,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=canceled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}
