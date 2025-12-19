import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// POST /api/stripe/terminal/payment-intent - Create a PaymentIntent for in-person payment
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check Stripe setup
    if (!tenant.stripeAccountId || !tenant.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: "Stripe Connect is not configured" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount, bookingId, invoiceId, contactId, description } = body;

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: "Amount must be at least $0.50" },
        { status: 400 }
      );
    }

    // Build metadata
    const metadata = {
      tenantId: tenant.id,
      source: "terminal",
    };

    if (bookingId) metadata.bookingId = bookingId;
    if (invoiceId) metadata.invoiceId = invoiceId;
    if (contactId) metadata.contactId = contactId;

    // Get contact info if provided
    let contact = null;
    if (contactId) {
      contact = await prisma.contact.findFirst({
        where: { id: contactId, tenantId: tenant.id },
      });
    } else if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, tenantId: tenant.id },
        include: { contact: true },
      });
      contact = booking?.contact;
    } else if (invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId: tenant.id },
        include: { contact: true },
      });
      contact = invoice?.contact;
    }

    // Create the PaymentIntent on the connected account
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount), // Amount in cents
        currency: "usd",
        payment_method_types: ["card_present"],
        capture_method: "automatic",
        description: description || "In-person payment",
        metadata,
        ...(contact?.stripeCustomerId && { customer: contact.stripeCustomerId }),
      },
      { stripeAccount: tenant.stripeAccountId }
    );

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error("Error creating Terminal PaymentIntent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/stripe/terminal/payment-intent?id=xxx - Check PaymentIntent status
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("id");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      { stripeAccount: tenant.stripeAccountId }
    );

    // Get charge details if succeeded
    let chargeDetails = null;
    if (paymentIntent.status === "succeeded" && paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(
        paymentIntent.latest_charge,
        { stripeAccount: tenant.stripeAccountId }
      );
      chargeDetails = {
        id: charge.id,
        receiptUrl: charge.receipt_url,
        cardBrand: charge.payment_method_details?.card_present?.brand,
        cardLast4: charge.payment_method_details?.card_present?.last4,
      };
    }

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        cancellationReason: paymentIntent.cancellation_reason,
      },
      charge: chargeDetails,
    });
  } catch (error) {
    console.error("Error checking PaymentIntent status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
