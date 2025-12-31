import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { calculateBookingPaymentStatus } from "@/lib/payment-allocation";
import {
  applyInvoiceStatusTag,
  applyPaymentStatusTag,
  applyBookingStatusTag,
  convertLeadToClient,
} from "@/lib/system-tags";

/**
 * POST /api/invoices/[id]/charge-card
 * Charge a card using a PaymentMethod from Stripe Elements (manual card entry)
 */
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { paymentMethodId, amount, isDeposit = false } = body;

    // Validate paymentMethodId
    if (!paymentMethodId || typeof paymentMethodId !== "string") {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    // Check if Stripe Connect is set up
    if (!tenant.stripeAccountId || tenant.stripeAccountStatus !== "active") {
      return NextResponse.json(
        { error: "Stripe payments are not configured. Please complete Stripe Connect setup." },
        { status: 400 }
      );
    }

    // Fetch the invoice with booking
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        booking: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Validate payment doesn't exceed balance
    const balanceDue = invoice.balanceDue ?? invoice.total;
    if (amount > balanceDue) {
      return NextResponse.json(
        { error: `Payment amount ($${(amount / 100).toFixed(2)}) exceeds balance due ($${(balanceDue / 100).toFixed(2)})` },
        { status: 400 }
      );
    }

    // Create PaymentIntent with the provided PaymentMethod
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          type: "manual_card_entry",
          invoiceId: invoice.id,
          tenantId: tenant.id,
          contactId: invoice.contactId || "",
          isDeposit: isDeposit.toString(),
          source: "dashboard",
        },
        description: `Invoice ${invoice.invoiceNumber}`,
      },
      {
        stripeAccount: tenant.stripeAccountId,
      }
    );

    // Check if payment requires additional action (3DS)
    if (paymentIntent.status === "requires_action") {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        message: "Additional authentication required",
      });
    }

    // Check if payment failed
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment failed with status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    // Payment succeeded - update records
    const newAmountPaid = (invoice.amountPaid || 0) + amount;
    const newBalanceDue = invoice.total - newAmountPaid;
    const isPaidInFull = newBalanceDue <= 0;

    console.log("[charge-card] Payment update calculation:", {
      invoiceId: invoice.id,
      invoiceTotal: invoice.total,
      previousAmountPaid: invoice.amountPaid,
      paymentAmount: amount,
      newAmountPaid,
      newBalanceDue,
      isPaidInFull,
    });

    // Determine new status
    let newStatus = invoice.status;
    if (isPaidInFull) {
      newStatus = "paid";
    } else if (invoice.status === "draft") {
      // If a payment is made on a draft invoice, transition to "sent"
      newStatus = "sent";
    }

    // Get charge details for card info
    const charges = await stripe.charges.list(
      {
        payment_intent: paymentIntent.id,
        limit: 1,
      },
      {
        stripeAccount: tenant.stripeAccountId,
      }
    );
    const charge = charges.data[0];

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        amount,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: charge?.id,
        stripeAccountId: tenant.stripeAccountId,
        status: "succeeded",
        contactId: invoice.contactId,
        clientName: invoice.contactName || invoice.contact?.name || "",
        clientEmail: invoice.contactEmail || invoice.contact?.email || "",
        cardBrand: charge?.payment_method_details?.card?.brand,
        cardLast4: charge?.payment_method_details?.card?.last4,
        stripeReceiptUrl: charge?.receipt_url,
        metadata: JSON.stringify({
          type: "manual_card_entry",
          isDeposit,
          invoiceId: invoice.id,
        }),
      },
    });

    // Create InvoicePayment junction record
    await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        paymentId: payment.id,
        amountApplied: amount,
      },
    });

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus,
        stripePaymentIntentId: paymentIntent.id,
        ...(isDeposit && !invoice.depositPaidAt && { depositPaidAt: new Date() }),
        ...(isPaidInFull && { paidAt: new Date() }),
      },
      include: {
        contact: true,
        booking: {
          include: {
            service: true,
            package: true,
            services: { include: { service: true } },
            packages: { include: { package: true } },
          },
        },
        coupons: {
          include: {
            coupon: true,
          },
        },
        payments: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                cardBrand: true,
                cardLast4: true,
                metadata: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    console.log("[charge-card] Invoice updated:", {
      invoiceId: updatedInvoice.id,
      status: updatedInvoice.status,
      amountPaid: updatedInvoice.amountPaid,
      balanceDue: updatedInvoice.balanceDue,
      paidAt: updatedInvoice.paidAt,
    });

    // Update linked booking payment status if exists (1:1 relationship)
    if (invoice.booking) {
      const booking = invoice.booking;
      const newBookingAmountPaid = (booking.bookingAmountPaid || 0) + amount;
      const newBookingBalanceDue = Math.max(0, booking.totalPrice - newBookingAmountPaid);

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          bookingAmountPaid: newBookingAmountPaid,
          bookingBalanceDue: newBookingBalanceDue,
          paymentStatus: calculateBookingPaymentStatus({
            totalPrice: booking.totalPrice,
            depositAllocated: booking.depositAllocated || 0,
            bookingAmountPaid: newBookingAmountPaid,
          }),
          ...(isDeposit && { depositAllocated: (booking.depositAllocated || 0) + amount }),
          // Transition to scheduled status when deposit is paid
          ...(isDeposit && booking.status === "pending" && { status: "scheduled" }),
        },
      });

      // Apply Scheduled tag when deposit payment moves booking from pending
      if (isDeposit && booking.status === "pending") {
        applyBookingStatusTag(prisma, booking.id, tenant.id, "scheduled", { tenant }).catch((err) => {
          console.error("Error applying booking scheduled tag:", err);
        });

        // Trigger booking_scheduled workflow
        triggerWorkflows("booking_scheduled", {
          tenant,
          booking: { ...booking, status: "scheduled" },
          contact: updatedInvoice.contact,
          invoice: updatedInvoice,
        }).catch((err) => {
          console.error("Error triggering booking_scheduled workflow:", err);
        });
      }
    }

    // Apply status tags
    // Payment status tag (succeeded)
    applyPaymentStatusTag(prisma, payment.id, tenant.id, "succeeded", { tenant, payment }).catch((err) => {
      console.error("Error applying payment status tag:", err);
    });

    // Invoice status tag (paid or deposit_paid)
    if (isPaidInFull) {
      applyInvoiceStatusTag(prisma, invoice.id, tenant.id, "paid", { tenant, invoice: updatedInvoice }).catch((err) => {
        console.error("Error applying invoice paid tag:", err);
      });
    } else if (isDeposit && !invoice.depositPaidAt) {
      // First deposit payment - apply deposit_paid tag
      applyInvoiceStatusTag(prisma, invoice.id, tenant.id, "deposit_paid", { tenant, invoice: updatedInvoice }).catch((err) => {
        console.error("Error applying invoice deposit_paid tag:", err);
      });

      // Trigger invoice_deposit_paid workflow
      triggerWorkflows("invoice_deposit_paid", {
        tenant,
        invoice: updatedInvoice,
        contact: updatedInvoice.contact,
        payment,
      }).catch((err) => {
        console.error("Error triggering invoice_deposit_paid workflow:", err);
      });
    }

    // Convert Lead to Client on first payment
    if (invoice.contactId) {
      convertLeadToClient(prisma, invoice.contactId, tenant.id, {
        tenant,
        contact: updatedInvoice.contact,
      }).catch((err) => {
        console.error("Error converting lead to client:", err);
      });
    }

    // Trigger workflows - they handle additional actions and emails
    // Always trigger payment_received for any payment
    triggerWorkflows("payment_received", {
      tenant,
      payment,
      invoice: updatedInvoice,
      contact: updatedInvoice.contact,
      isDeposit,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
    });

    // Trigger invoice_paid when fully paid
    if (isPaidInFull) {
      triggerWorkflows("invoice_paid", {
        tenant,
        invoice: updatedInvoice,
        contact: updatedInvoice.contact,
      }).catch((err) => {
        console.error("Error triggering invoice_paid workflow:", err);
      });
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
        receiptUrl: payment.stripeReceiptUrl,
      },
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
      },
      isPaidInFull,
      newBalance: Math.max(0, newBalanceDue),
    });
  } catch (error) {
    console.error("[POST /api/invoices/[id]/charge-card] Error:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeCardError") {
      return NextResponse.json(
        { error: error.message || "Card was declined" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process card payment" },
      { status: 500 }
    );
  }
}
