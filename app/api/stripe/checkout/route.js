import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  try {
    const body = await request.json();
    const { priceId, planType, successUrl, cancelUrl } = body;

    if (!priceId || !planType) {
      return NextResponse.json(
        { error: "Price ID and plan type are required" },
        { status: 400 }
      );
    }

    // Check if user is signed in and has an existing Stripe customer
    const { orgId } = await auth();
    let customerId = null;
    let customerEmail = null;

    if (orgId) {
      const tenant = await prisma.tenant.findUnique({
        where: { clerkOrgId: orgId },
        select: { stripeCustomerId: true, email: true },
      });

      if (tenant?.stripeCustomerId) {
        customerId = tenant.stripeCustomerId;
      }
      if (tenant?.email) {
        customerEmail = tenant.email;
      }
    }

    // Build checkout session options
    const sessionOptions = {
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
          planType: planType,
        },
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/payment`,
      allow_promotion_codes: true,
    };

    // Attach existing customer or prefill email
    if (customerId) {
      sessionOptions.customer = customerId;
    } else if (customerEmail) {
      sessionOptions.customer_email = customerEmail;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionOptions);

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
