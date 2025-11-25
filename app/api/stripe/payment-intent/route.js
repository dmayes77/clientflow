import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = "usd", bookingId, clientEmail, clientName } = body;

    // Validate required fields
    if (!amount || !clientEmail || !clientName) {
      return NextResponse.json(
        { error: "Amount, client email, and client name are required" },
        { status: 400 }
      );
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check if Stripe account is connected and onboarded
    if (!tenant.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected" },
        { status: 400 }
      );
    }

    if (!tenant.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: "Stripe onboarding not complete" },
        { status: 400 }
      );
    }

    // Create payment intent with connected account
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount), // Amount in cents
        currency: currency.toLowerCase(),
        metadata: {
          tenantId: tenant.id,
          bookingId: bookingId || "",
          clientEmail,
          clientName,
        },
        // Application fee (platform fee) - optional, set to 0 for now
        // application_fee_amount: Math.round(amount * 0.02), // 2% platform fee
      },
      {
        stripeAccount: tenant.stripeAccountId, // Connected account
      }
    );

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        bookingId: bookingId || null,
        stripePaymentIntentId: paymentIntent.id,
        stripeAccountId: tenant.stripeAccountId,
        amount,
        currency,
        status: "pending",
        clientEmail,
        clientName,
        metadata: JSON.stringify({
          created: new Date().toISOString(),
        }),
      },
    });

    // If bookingId provided, update booking with payment info
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentId: payment.id,
          paymentStatus: "pending",
        },
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent", details: error.message },
      { status: 500 }
    );
  }
}
