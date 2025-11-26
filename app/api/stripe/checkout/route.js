import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  try {
    const body = await request.json();
    const { priceId, planType } = body;

    if (!priceId || !planType) {
      return NextResponse.json(
        { error: "Price ID and plan type are required" },
        { status: 400 }
      );
    }

    // Create Checkout Session - Stripe will collect email
    // After payment, webhook will create Clerk account & tenant
    const session = await stripe.checkout.sessions.create({
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
      // Stripe will collect email during checkout
      customer_email: undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
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
