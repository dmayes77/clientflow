import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// POST /api/stripe/terminal/process-payment - Send payment to reader for collection
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { readerId, paymentIntentId } = body;

    if (!readerId) {
      return NextResponse.json(
        { error: "Reader ID is required" },
        { status: 400 }
      );
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID is required" },
        { status: 400 }
      );
    }

    // Verify the reader belongs to this tenant
    const reader = await prisma.terminalReader.findFirst({
      where: {
        id: readerId,
        tenantId: tenant.id,
      },
    });

    if (!reader) {
      return NextResponse.json({ error: "Reader not found" }, { status: 404 });
    }

    // Send the payment to the reader
    const processedReader = await stripe.terminal.readers.processPaymentIntent(
      reader.stripeReaderId,
      { payment_intent: paymentIntentId },
      { stripeAccount: tenant.stripeAccountId }
    );

    return NextResponse.json({
      success: true,
      reader: {
        id: reader.id,
        stripeReaderId: processedReader.id,
        status: processedReader.status,
        action: processedReader.action,
      },
    });
  } catch (error) {
    console.error("Error processing Terminal payment:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      if (error.message.includes("offline")) {
        return NextResponse.json(
          { error: "Reader is offline. Please ensure it's powered on and connected." },
          { status: 400 }
        );
      }
      if (error.message.includes("busy")) {
        return NextResponse.json(
          { error: "Reader is busy with another transaction." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/stripe/terminal/process-payment - Cancel a payment in progress
export async function DELETE(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const readerId = searchParams.get("readerId");

    if (!readerId) {
      return NextResponse.json(
        { error: "Reader ID is required" },
        { status: 400 }
      );
    }

    // Verify the reader belongs to this tenant
    const reader = await prisma.terminalReader.findFirst({
      where: {
        id: readerId,
        tenantId: tenant.id,
      },
    });

    if (!reader) {
      return NextResponse.json({ error: "Reader not found" }, { status: 404 });
    }

    // Cancel the action on the reader
    const canceledReader = await stripe.terminal.readers.cancelAction(
      reader.stripeReaderId,
      { stripeAccount: tenant.stripeAccountId }
    );

    return NextResponse.json({
      success: true,
      reader: {
        id: reader.id,
        status: canceledReader.status,
        action: canceledReader.action,
      },
    });
  } catch (error) {
    console.error("Error canceling Terminal action:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
