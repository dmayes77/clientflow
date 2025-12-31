import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { calculateBookingPaymentStatus } from "@/lib/payment-allocation";
import { createId } from "@paralleldrive/cuid2";
import {
  applyInvoiceStatusTag,
  applyPaymentStatusTag,
  applyBookingStatusTag,
  convertLeadToClient,
} from "@/lib/system-tags";

/**
 * POST /api/invoices/[id]/record-payment
 * Record an offline payment (cash, check, Venmo, etc.)
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

    const { amount, method = "other", notes, isDeposit = false } = body;

    // Validate amount
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    // Validate method
    const validMethods = ["cash", "check", "venmo", "zelle", "bank_transfer", "other"];
    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: `Invalid payment method. Must be one of: ${validMethods.join(", ")}` },
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

    // Calculate new amounts
    const newAmountPaid = (invoice.amountPaid || 0) + amount;
    const newBalanceDue = invoice.total - newAmountPaid;
    const isPaidInFull = newBalanceDue <= 0;

    // Determine new status
    let newStatus = invoice.status;
    if (isPaidInFull) {
      newStatus = "paid";
    } else if (invoice.status === "draft") {
      // If a payment is made on a draft invoice, transition to "sent"
      newStatus = "sent";
    }

    // Create Payment record with offline payment ID
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        amount,
        stripePaymentIntentId: `offline_${createId()}`,
        stripeAccountId: tenant.stripeAccountId || "offline",
        status: "succeeded",
        contactId: invoice.contactId,
        clientName: invoice.contactName || invoice.contact?.name || "",
        clientEmail: invoice.contactEmail || invoice.contact?.email || "",
        metadata: JSON.stringify({
          method,
          notes: notes || null,
          isDeposit,
          recordedBy: "dashboard",
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
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

    // Apply status tags (synchronously so they're included in response)
    // Payment status tag (succeeded)
    try {
      await applyPaymentStatusTag(prisma, payment.id, tenant.id, "succeeded", { tenant, payment });
    } catch (err) {
      console.error("Error applying payment status tag:", err);
    }

    // Invoice status tag (paid or deposit_paid)
    if (isPaidInFull) {
      try {
        await applyInvoiceStatusTag(prisma, invoice.id, tenant.id, "paid", { tenant, invoice: updatedInvoice });
      } catch (err) {
        console.error("Error applying invoice paid tag:", err);
      }
    } else if (isDeposit && !invoice.depositPaidAt) {
      // First deposit payment - apply deposit_paid tag
      try {
        await applyInvoiceStatusTag(prisma, invoice.id, tenant.id, "deposit_paid", { tenant, invoice: updatedInvoice });
      } catch (err) {
        console.error("Error applying invoice deposit_paid tag:", err);
      }

      // Trigger invoice_deposit_paid workflow (async - doesn't need to complete before response)
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

    // Re-fetch invoice with updated tags for response
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Flatten tags for frontend consumption
    const flattenedTags = finalInvoice?.tags?.map((it) => it.tag) || [];

    return NextResponse.json({
      success: true,
      invoice: { ...finalInvoice, tags: flattenedTags },
      payment: {
        id: payment.id,
        amount: payment.amount,
        method,
        status: payment.status,
      },
      isPaidInFull,
      newBalance: Math.max(0, newBalanceDue),
    });
  } catch (error) {
    console.error("[POST /api/invoices/[id]/record-payment] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
