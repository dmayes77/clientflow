import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/payments/[id]/refund - Process refund for a payment
export async function POST(request, { params }) {
  try {
    const { orgId } = await auth();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true, stripeAccountId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 });
    }

    // Get the payment
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if payment can be refunded
    if (payment.status === "refunded") {
      return NextResponse.json({ error: "Payment is already fully refunded" }, { status: 400 });
    }

    if (payment.status === "disputed") {
      return NextResponse.json(
        { error: "Cannot refund a disputed payment. Handle through Stripe Dashboard." },
        { status: 400 }
      );
    }

    // Calculate max refundable amount
    const refundedSoFar = payment.refundedAmount || 0;
    const maxRefundable = payment.amount - refundedSoFar;

    if (amount > maxRefundable) {
      return NextResponse.json(
        { error: `Maximum refundable amount is ${maxRefundable} cents` },
        { status: 400 }
      );
    }

    // Process refund through Stripe
    // For Connect payments, we need to use the connected account
    const stripeAccount = payment.stripeAccountId || tenant.stripeAccountId;

    if (!stripeAccount) {
      return NextResponse.json(
        { error: "Stripe account not found for this payment" },
        { status: 400 }
      );
    }

    // Create refund on the connected account
    const refund = await stripe.refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
        amount: amount,
        reason: "requested_by_customer",
      },
      {
        stripeAccount: stripeAccount,
      }
    );

    // Update payment record
    const newRefundedAmount = refundedSoFar + amount;
    const isFullyRefunded = newRefundedAmount >= payment.amount;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullyRefunded ? "refunded" : "partial_refund",
        refundedAmount: newRefundedAmount,
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata || "{}"),
          refunds: [
            ...(JSON.parse(payment.metadata || "{}")?.refunds || []),
            {
              id: refund.id,
              amount: amount,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      },
    });

    // Update booking payment status if applicable
    if (payment.bookingId) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          paymentStatus: isFullyRefunded ? "refunded" : "partial_refund",
        },
      });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: amount,
        status: refund.status,
      },
      payment: {
        id: payment.id,
        status: isFullyRefunded ? "refunded" : "partial_refund",
        refundedAmount: newRefundedAmount,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        { error: error.message || "Invalid refund request" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
