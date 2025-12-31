import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { applyInvoiceStatusTag } from "@/lib/system-tags";

/**
 * POST /api/payments/[id]/sync
 * Sync payment status from Stripe (handles refunds that webhook may have missed)
 */
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        invoices: {
          include: {
            invoice: true,
          },
        },
        bookings: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    console.log("[POST /api/payments/[id]/sync] Payment data:", {
      id: payment.id,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeChargeId: payment.stripeChargeId,
      stripeAccountId: payment.stripeAccountId,
      status: payment.status,
    });

    // Check if this is an offline payment (can't sync with Stripe)
    if (payment.stripePaymentIntentId?.startsWith("offline_")) {
      return NextResponse.json({
        error: "Cannot sync offline payments with Stripe"
      }, { status: 400 });
    }

    // If we have a charge ID but no payment intent, try to fetch the charge directly
    const hasChargeId = !!payment.stripeChargeId;
    const hasPaymentIntentId = !!payment.stripePaymentIntentId;

    if (!hasPaymentIntentId && !hasChargeId) {
      return NextResponse.json({
        error: "No Stripe payment intent or charge associated with this payment"
      }, { status: 400 });
    }

    if (!payment.stripeAccountId) {
      return NextResponse.json({
        error: "No Stripe connected account associated with this payment"
      }, { status: 400 });
    }

    // Fetch from Stripe - try payment intent first, fall back to charge
    let charge;
    let paymentIntentStatus = "succeeded"; // Default for charge-only payments

    try {
      if (hasPaymentIntentId) {
        // Fetch payment intent with charges expanded
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.stripePaymentIntentId,
          { expand: ["charges.data.refunds"] },
          { stripeAccount: payment.stripeAccountId }
        );
        console.log("[POST /api/payments/[id]/sync] PaymentIntent status:", paymentIntent.status);
        console.log("[POST /api/payments/[id]/sync] Charges count:", paymentIntent.charges?.data?.length || 0);

        charge = paymentIntent.charges?.data?.[0];
        paymentIntentStatus = paymentIntent.status;
      }

      // If no charge from payment intent, try direct charge fetch
      if (!charge && hasChargeId) {
        console.log("[POST /api/payments/[id]/sync] Fetching charge directly:", payment.stripeChargeId);
        charge = await stripe.charges.retrieve(
          payment.stripeChargeId,
          { expand: ["refunds"] },
          { stripeAccount: payment.stripeAccountId }
        );
      }
    } catch (stripeError) {
      console.error("[POST /api/payments/[id]/sync] Stripe error:", stripeError);
      return NextResponse.json({
        error: `Failed to fetch from Stripe: ${stripeError.message}`
      }, { status: 500 });
    }

    if (!charge) {
      console.error("[POST /api/payments/[id]/sync] No charge found");
      return NextResponse.json({
        error: "No charge found for this payment"
      }, { status: 400 });
    }

    console.log("[POST /api/payments/[id]/sync] Charge data:", {
      id: charge.id,
      refunded: charge.refunded,
      amount_refunded: charge.amount_refunded,
    });

    // Calculate refund info
    const amountRefunded = charge.amount_refunded || 0;
    const isFullyRefunded = charge.refunded;
    const isPartiallyRefunded = amountRefunded > 0 && !isFullyRefunded;

    // Determine new payment status
    let newPaymentStatus = payment.status;
    if (isFullyRefunded) {
      newPaymentStatus = "refunded";
    } else if (isPartiallyRefunded) {
      newPaymentStatus = "partial_refund";
    } else if (paymentIntentStatus === "succeeded" || charge.status === "succeeded") {
      newPaymentStatus = "succeeded";
    }

    const statusChanged = newPaymentStatus !== payment.status;
    const refundAmountChanged = amountRefunded !== (payment.refundedAmount || 0);

    if (!statusChanged && !refundAmountChanged) {
      return NextResponse.json({
        success: true,
        message: "Payment is already in sync with Stripe",
        changed: false,
      });
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newPaymentStatus,
        refundedAmount: amountRefunded,
        // Also update card details if missing
        cardBrand: payment.cardBrand || charge.payment_method_details?.card?.brand || null,
        cardLast4: payment.cardLast4 || charge.payment_method_details?.card?.last4 || null,
        stripeReceiptUrl: payment.stripeReceiptUrl || charge.receipt_url || null,
      },
    });

    // Update linked invoices if refunded
    if ((isFullyRefunded || isPartiallyRefunded) && payment.invoices?.length > 0) {
      for (const invoicePayment of payment.invoices) {
        const invoice = invoicePayment.invoice;
        if (!invoice) continue;

        // Calculate refund amount applied to this invoice
        const refundApplied = isFullyRefunded
          ? invoicePayment.amountApplied
          : Math.min(invoicePayment.amountApplied, amountRefunded);

        const newAmountPaid = Math.max(0, (invoice.amountPaid || 0) - refundApplied);
        const newBalanceDue = invoice.total - newAmountPaid;

        // Determine new invoice status
        let newInvoiceStatus = invoice.status;
        if (isFullyRefunded && invoice.status === "paid") {
          newInvoiceStatus = invoice.sentAt ? "sent" : "draft";
        } else if (newBalanceDue > 0 && invoice.status === "paid") {
          newInvoiceStatus = "sent";
        }

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newAmountPaid,
            balanceDue: newBalanceDue,
            status: newInvoiceStatus,
            ...(newBalanceDue > 0 && { paidAt: null }),
          },
        });

        // Apply status tag if changed
        if (newInvoiceStatus !== invoice.status) {
          await applyInvoiceStatusTag(prisma, invoice.id, tenant.id, newInvoiceStatus);
        }
      }
    }

    // Update linked bookings if refunded
    if ((isFullyRefunded || isPartiallyRefunded) && payment.bookings?.length > 0) {
      for (const booking of payment.bookings) {
        const newBookingStatus = isFullyRefunded ? "refunded" : "partial_refund";
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: newBookingStatus,
            ...(isFullyRefunded && {
              bookingAmountPaid: 0,
              bookingBalanceDue: booking.totalPrice,
            }),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment synced from Stripe. Status: ${newPaymentStatus}${amountRefunded > 0 ? `, Refunded: $${(amountRefunded / 100).toFixed(2)}` : ""}`,
      changed: true,
      newStatus: newPaymentStatus,
      refundedAmount: amountRefunded,
    });
  } catch (error) {
    console.error("[POST /api/payments/[id]/sync] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync payment" },
      { status: 500 }
    );
  }
}
