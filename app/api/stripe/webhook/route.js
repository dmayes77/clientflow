import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createId } from "@paralleldrive/cuid2";
import {
  dispatchPaymentReceived,
  dispatchPaymentFailed,
  dispatchInvoicePaid,
} from "@/lib/webhooks";
import { sendDisputeNotification, sendTrialEndingNotification } from "@/lib/email";
import { triggerEventAlert, triggerEventAlertByStripeCustomer } from "@/lib/alert-runner";
import { calculateBookingPaymentStatus } from "@/lib/payment-allocation";
import { triggerWorkflows } from "@/lib/workflow-executor";
import {
  applyInvoiceStatusTag,
  applyPaymentStatusTag,
  applyBookingStatusTag,
  convertLeadToClient,
} from "@/lib/system-tags";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature || !webhookSecret) {
    console.error("Missing stripe signature or webhook secret");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Check if this is a Connect webhook (has account field)
  const isConnectEvent = !!event.account;

  try {
    // Connect-specific event handlers
    if (isConnectEvent) {
      switch (event.type) {
        case "checkout.session.completed":
          await handleConnectCheckoutCompleted(event.data.object, event.account);
          break;

        case "checkout.session.async_payment_succeeded":
          await handleConnectAsyncPaymentSucceeded(event.data.object, event.account);
          break;

        case "checkout.session.async_payment_failed":
          await handleConnectAsyncPaymentFailed(event.data.object, event.account);
          break;

        case "charge.succeeded":
          await handleConnectChargeSucceeded(event.data.object, event.account);
          break;

        case "charge.refunded":
          await handleConnectChargeRefunded(event.data.object, event.account);
          break;

        case "charge.dispute.created":
          await handleConnectDisputeCreated(event.data.object, event.account);
          break;

        case "payment_intent.succeeded":
          await handleConnectPaymentIntentSucceeded(event.data.object, event.account);
          break;

        default:
      }
      return NextResponse.json({ received: true });
    }

    // Platform event handlers
    switch (event.type) {
      // Payment Intent Events
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      // Checkout Session Events
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      // Subscription Events
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object);
        break;

      // Invoice Events
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // Stripe Connect Account Events
      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook ${event.type}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handler: Payment Intent Succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {

  const { metadata } = paymentIntent;

  if (!metadata?.tenantId) {
    return;
  }

  // Find or create payment record
  let payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (!payment) {
    // Create new payment record
    payment = await prisma.payment.create({
      data: {
        tenantId: metadata.tenantId,
        stripePaymentIntentId: paymentIntent.id,
        stripeAccountId: paymentIntent.on_behalf_of || "",
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "succeeded",
        contactEmail: paymentIntent.receipt_email || metadata.contactEmail || "",
        contactName: metadata.contactName || "",
        bookingId: metadata.bookingId || null,
        metadata: JSON.stringify(metadata),
      },
    });
  } else {
    // Update existing payment
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "succeeded" },
    });
  }

  // Update booking payment status if applicable
  if (metadata.bookingId) {
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: {
        paymentStatus: "paid",
        paymentId: payment.id,
      },
    });
  }

  // Dispatch webhook
  dispatchPaymentReceived(metadata.tenantId, {
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    contactName: payment.contactName,
    contactEmail: payment.contactEmail,
    bookingId: payment.bookingId,
    status: payment.status,
    createdAt: payment.createdAt,
  }).catch(console.error);
}

// Handler: Payment Intent Failed
async function handlePaymentIntentFailed(paymentIntent) {

  const { metadata } = paymentIntent;

  if (!metadata?.tenantId) {
    return;
  }

  // Update or create payment record
  const existingPayment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (existingPayment) {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "failed",
        metadata: JSON.stringify({
          ...JSON.parse(existingPayment.metadata || "{}"),
          failureReason: paymentIntent.last_payment_error?.message,
        }),
      },
    });
  }

  // Dispatch webhook
  dispatchPaymentFailed(metadata.tenantId, {
    id: existingPayment?.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    contactEmail: metadata.contactEmail,
    status: "failed",
  }).catch(console.error);
}

// Handler: Checkout Session Completed
async function handleCheckoutSessionCompleted(session) {

  const { metadata, customer, subscription } = session;

  // Find tenant by metadata.tenantId or by stripeCustomerId
  let tenant = null;
  if (metadata?.tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: metadata.tenantId },
    });
  }

  // Fallback: find by customer ID
  if (!tenant && customer) {
    tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customer },
    });
  }

  if (!tenant) {
    return;
  }

  // Update tenant with subscription info
  const updateData = {
    stripeCustomerId: customer,
  };

  if (subscription) {
    updateData.stripeSubscriptionId = subscription;

    // Get subscription details
    const sub = await stripe.subscriptions.retrieve(subscription);
    updateData.currentPeriodEnd = new Date(sub.current_period_end * 1000);

    // Set subscription status based on Stripe's status
    updateData.subscriptionStatus = sub.status;

    // Determine plan type from metadata first, then lookup by price
    if (metadata?.planSlug) {
      updateData.planType = metadata.planSlug;
      // Also lookup and set planId
      const plan = await prisma.plan.findFirst({
        where: { slug: metadata.planSlug },
      });
      if (plan) {
        updateData.planId = plan.id;
      }
    } else {
      // Lookup plan from database by price ID
      const priceId = sub.items.data[0]?.price.id;
      if (priceId) {
        const plan = await prisma.plan.findFirst({
          where: {
            OR: [
              { stripePriceId: priceId },
              { stripePriceIdYearly: priceId },
            ],
          },
        });
        if (plan) {
          updateData.planType = plan.slug;
          updateData.planId = plan.id;
        }
      }
    }
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
  });

}

// Handler: Subscription Updated/Created
async function handleSubscriptionUpdated(subscription) {
  try {

    // Get customer ID (can be string or expanded object)
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;


    // Try to find tenant by subscription ID first
    let tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    // Fallback: find by customer ID (needed for subscription.created events)
    if (!tenant && customerId) {
      tenant = await prisma.tenant.findFirst({
        where: { stripeCustomerId: customerId },
      });
    }

    if (!tenant) {
      return;
    }


    const updateData = {
      subscriptionStatus: subscription.status,
    };

    // Only set currentPeriodEnd if it exists
    if (subscription.current_period_end) {
      updateData.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }

    // Set subscription ID if not already set
    if (!tenant.stripeSubscriptionId) {
      updateData.stripeSubscriptionId = subscription.id;
    }

    // Check for plan changes - lookup from database
    const priceId = subscription.items?.data?.[0]?.price?.id;
    if (priceId) {
      const plan = await prisma.plan.findFirst({
        where: {
          OR: [
            { stripePriceId: priceId },
            { stripePriceIdYearly: priceId },
          ],
        },
      });
      if (plan) {
        updateData.planType = plan.slug;
        updateData.planId = plan.id;
      }
    }


    await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
    });

  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
    throw error;
  }
}

// Handler: Subscription Deleted
async function handleSubscriptionDeleted(subscription) {

  const tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) {
    return;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
    },
  });

  // Trigger automated subscription_cancelled alert
  triggerEventAlert("subscription_cancelled", tenant.id).catch((err) =>
    console.error("Error triggering subscription_cancelled alert:", err)
  );
}

// Handler: Trial Will End
async function handleTrialWillEnd(subscription) {

  const tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: {
      plan: true,
    },
  });

  if (!tenant) {
    return;
  }

  if (!tenant.email) {
    return;
  }

  // Get trial end date from subscription
  const trialEndDate = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : tenant.currentPeriodEnd;

  if (!trialEndDate) {
    return;
  }

  // Get plan name (fallback to planType if plan relation doesn't exist)
  const planName = tenant.plan?.name || tenant.planType || "your plan";

  // Send trial ending notification email
  try {
    const billingUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`
      : "https://app.getclientflow.app/dashboard/settings/billing";

    await sendTrialEndingNotification({
      to: tenant.email,
      businessName: tenant.businessName || tenant.name,
      planName,
      trialEndDate,
      billingUrl,
    });

  } catch (error) {
    console.error("Failed to send trial ending email:", error);
    // Don't throw - email failure shouldn't break webhook processing
  }
}

// Handler: Invoice Payment Succeeded
async function handleInvoicePaymentSucceeded(invoice) {

  // Update subscription status if needed
  if (invoice.subscription) {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (tenant && tenant.subscriptionStatus === "past_due") {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: "active" },
      });
    }
  }

  // Check for invoice payment (not subscription)
  const { metadata } = invoice;
  if (metadata?.invoiceId) {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: metadata.invoiceId },
    });

    if (existingInvoice) {
      await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          status: "paid",
          paidAt: new Date(),
          stripePaymentIntentId: invoice.payment_intent,
        },
      });

      // Dispatch webhook
      dispatchInvoicePaid(existingInvoice.tenantId, {
        id: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        contactName: existingInvoice.contactName,
        contactEmail: existingInvoice.contactEmail,
        total: existingInvoice.total,
        paidAt: new Date(),
        status: "paid",
      }).catch(console.error);
    }
  }
}

// Handler: Invoice Payment Failed
async function handleInvoicePaymentFailed(invoice) {

  if (invoice.subscription) {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (tenant) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: "past_due" },
      });

      // Trigger automated payment_failed alert
      triggerEventAlert("payment_failed", tenant.id, {
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        attemptCount: invoice.attempt_count,
      }).catch((err) => console.error("Error triggering payment_failed alert:", err));
    }
  }
}

// Handler: Stripe Connect Account Updated
async function handleAccountUpdated(account) {

  const tenant = await prisma.tenant.findFirst({
    where: { stripeAccountId: account.id },
  });

  if (!tenant) {
    return;
  }

  const updateData = {};

  // Check if onboarding is complete
  if (account.details_submitted && account.charges_enabled) {
    updateData.stripeOnboardingComplete = true;
    updateData.stripeAccountStatus = "active";
  } else if (account.requirements?.disabled_reason) {
    updateData.stripeAccountStatus = "restricted";
  } else if (account.details_submitted) {
    updateData.stripeAccountStatus = "pending";
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
    });
  }
}

// ===========================================
// Connect Event Handlers (for tenant payments)
// ===========================================

// Handler: Connect Checkout Session Completed
async function handleConnectCheckoutCompleted(session, accountId) {
  // This webhook fires before payment_intent.succeeded
  // The payment_intent.succeeded handler does the heavy lifting:
  // - Creates Payment record
  // - Auto-creates Invoice
  // - Updates Booking with status, payment tracking, and invoice link
  // - Applies tags and triggers workflows
  //
  // This handler is kept minimal as a logging checkpoint only
  const { metadata } = session;

  if (metadata?.type === "booking_payment" && metadata?.bookingId) {
    console.log("[webhook] checkout.session.completed for booking:", metadata.bookingId);
    // Payment processing handled by payment_intent.succeeded webhook
  }
}

// Handler: Connect Charge Succeeded - Capture card details for chargeback evidence
async function handleConnectChargeSucceeded(charge, accountId) {

  const { payment_intent, metadata } = charge;

  if (!payment_intent) {
    return;
  }

  // Find existing payment record
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentIntentId: typeof payment_intent === "string" ? payment_intent : payment_intent.id,
    },
  });

  if (!payment) {
    return;
  }

  // Update payment with card details for chargeback evidence
  const cardDetails = charge.payment_method_details?.card;

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      stripeChargeId: charge.id,
      stripeReceiptUrl: charge.receipt_url || null,
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null,
      capturedAt: charge.captured ? new Date() : null,
    },
    include: {
      contact: true,
      tenant: true,
    },
  });

  // Trigger payment_received workflow - handles tags and emails
  triggerWorkflows("payment_received", {
    tenant: updatedPayment.tenant,
    payment: updatedPayment,
    contact: updatedPayment.contact,
  }).catch((err) => {
    console.error("Error triggering payment_received workflow:", err);
  });
}

// Handler: Connect Charge Refunded
async function handleConnectChargeRefunded(charge, accountId) {
  console.log("[webhook] charge.refunded received for charge:", charge.id);

  const { payment_intent, amount_refunded, refunded } = charge;

  if (!payment_intent) {
    console.log("[webhook] No payment_intent in charge, skipping");
    return;
  }

  // Find payment record with bookings and invoices (including invoice's linked booking)
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentIntentId: typeof payment_intent === "string" ? payment_intent : payment_intent.id,
    },
    include: {
      bookings: true,
      invoices: {
        include: {
          invoice: {
            include: {
              booking: true, // Include the invoice's linked booking for refund updates
            },
          },
        },
      },
    },
  });

  if (!payment) {
    console.log("[webhook] Payment not found for payment_intent:", payment_intent);
    return;
  }

  console.log("[webhook] Found payment:", payment.id, "amount_refunded:", amount_refunded, "full refund:", refunded);

  // Determine refund status
  const isFullRefund = refunded;
  const newStatus = isFullRefund ? "refunded" : "partial_refund";

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      refundedAmount: amount_refunded,
    },
  });

  // Update booking payment status if applicable (many-to-many relationship)
  if (payment.bookings && payment.bookings.length > 0) {
    console.log("[webhook] Updating", payment.bookings.length, "linked bookings");
    await Promise.all(
      payment.bookings.map((booking) =>
        prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: isFullRefund ? "refunded" : "partial_refund",
            bookingAmountPaid: isFullRefund ? 0 : Math.max(0, (booking.bookingAmountPaid || 0) - amount_refunded),
            bookingBalanceDue: isFullRefund ? booking.totalPrice : Math.min(booking.totalPrice, (booking.bookingBalanceDue || 0) + amount_refunded),
          },
        })
      )
    );
  }

  // Update linked invoices
  if (payment.invoices && payment.invoices.length > 0) {
    console.log("[webhook] Updating", payment.invoices.length, "linked invoices");
    for (const invoicePayment of payment.invoices) {
      const invoice = invoicePayment.invoice;
      if (!invoice) continue;

      // Calculate how much of this payment's refund applies to this invoice
      // For simplicity, if full refund, subtract the full amountApplied
      // For partial refund, proportionally reduce based on refund amount
      const refundApplied = isFullRefund
        ? invoicePayment.amountApplied
        : Math.min(invoicePayment.amountApplied, amount_refunded);

      const newAmountPaid = Math.max(0, (invoice.amountPaid || 0) - refundApplied);
      const newBalanceDue = invoice.total - newAmountPaid;

      // Determine new status
      let newInvoiceStatus = invoice.status;
      if (isFullRefund && invoice.status === "paid") {
        // If fully refunded from paid status, revert to sent
        newInvoiceStatus = invoice.sentAt ? "sent" : "draft";
      } else if (newBalanceDue > 0 && invoice.status === "paid") {
        // If partial refund creates a balance, mark as sent (needs more payment)
        newInvoiceStatus = "sent";
      }

      console.log("[webhook] Updating invoice", invoice.id, "newAmountPaid:", newAmountPaid, "newBalanceDue:", newBalanceDue, "newStatus:", newInvoiceStatus);

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newInvoiceStatus,
          // Clear paidAt if no longer fully paid
          ...(newBalanceDue > 0 && { paidAt: null }),
        },
        include: { tenant: true, contact: true },
      });

      // Trigger refund workflow if status changed (handles tags)
      if (newInvoiceStatus !== invoice.status) {
        triggerWorkflows("invoice_refunded", {
          tenant: updatedInvoice.tenant,
          invoice: updatedInvoice,
          contact: updatedInvoice.contact,
          isFullRefund,
        }).catch((err) => {
          console.error("Error triggering invoice_refunded workflow:", err);
        });
      }

      // Update the invoice's linked booking (1:1 relationship)
      if (invoice.booking) {
        const booking = invoice.booking;
        const bookingRefundApplied = refundApplied; // Same amount applied to invoice applies to booking

        const newBookingAmountPaid = Math.max(0, (booking.bookingAmountPaid || 0) - bookingRefundApplied);
        const newBookingBalanceDue = Math.max(0, booking.totalPrice - newBookingAmountPaid);

        // Determine new booking payment status
        let newBookingPaymentStatus = booking.paymentStatus;
        if (isFullRefund) {
          newBookingPaymentStatus = "refunded";
        } else if (newBookingAmountPaid === 0) {
          newBookingPaymentStatus = "unpaid";
        } else if (newBookingAmountPaid < booking.totalPrice) {
          newBookingPaymentStatus = "deposit_paid";
        }

        console.log("[webhook] Updating invoice-linked booking", booking.id, "newAmountPaid:", newBookingAmountPaid, "newBalanceDue:", newBookingBalanceDue, "newStatus:", newBookingPaymentStatus);

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            bookingAmountPaid: newBookingAmountPaid,
            bookingBalanceDue: newBookingBalanceDue,
            paymentStatus: newBookingPaymentStatus,
            // If full refund, also clear deposit allocation
            ...(isFullRefund && { depositAllocated: 0 }),
          },
        });
      }
    }
  }

  console.log("[webhook] charge.refunded processing complete");
}

// Handler: Connect Dispute Created
async function handleConnectDisputeCreated(dispute, accountId) {

  const { charge, reason, status, amount } = dispute;

  if (!charge) {
    return;
  }

  // Find payment by charge ID
  const payment = await prisma.payment.findFirst({
    where: { stripeChargeId: typeof charge === "string" ? charge : charge.id },
  });

  if (!payment) {
    return;
  }

  // Update payment with dispute info
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "disputed",
      disputeStatus: status, // warning_needs_response, needs_response, etc.
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || "{}"),
        dispute: {
          id: dispute.id,
          reason,
          amount,
          createdAt: new Date().toISOString(),
        },
      }),
    },
  });


  // Send notification to tenant about the dispute
  try {
    // Get tenant info for notification
    const tenant = await prisma.tenant.findUnique({
      where: { id: payment.tenantId },
      select: {
        email: true,
        businessName: true,
        name: true,
      },
    });

    const reasonDescriptions = {
      duplicate: "Customer claims this is a duplicate charge",
      fraudulent: "Customer claims they didn't authorize this payment",
      subscription_canceled: "Customer claims subscription was canceled",
      product_unacceptable: "Customer claims product/service was not as described",
      product_not_received: "Customer claims product/service was not received",
      unrecognized: "Customer doesn't recognize the charge",
      credit_not_processed: "Customer claims a credit/refund was not processed",
      general: "General dispute",
    };
    const reasonText = reasonDescriptions[reason] || reason;

    const dashboardUrl = `https://dashboard.stripe.com/${process.env.NODE_ENV === "production" ? "" : "test/"}disputes/${dispute.id}`;

    // Create in-app alert
    await prisma.alert.create({
      data: {
        tenantId: payment.tenantId,
        type: "dispute",
        severity: "critical",
        title: `Payment Dispute: $${(amount / 100).toFixed(2)}`,
        message: `${payment.clientName || "A customer"} has disputed a payment. Reason: ${reasonText}. You have limited time to respond.`,
        actionUrl: dashboardUrl,
        actionLabel: "Respond to Dispute",
        referenceType: "payment",
        referenceId: payment.id,
        metadata: {
          disputeId: dispute.id,
          reason,
          amount,
          chargeId: typeof charge === "string" ? charge : charge.id,
        },
      },
    });

    // Trigger automated dispute_created alert rules
    triggerEventAlert("dispute_created", payment.tenantId, {
      disputeId: dispute.id,
      reason,
      amount,
    }).catch((err) => console.error("Error triggering dispute_created alert:", err));

    // Send email notification
    if (tenant?.email) {
      await sendDisputeNotification({
        to: tenant.email,
        businessName: tenant.businessName || tenant.name || "Your Business",
        paymentAmount: amount,
        clientName: payment.clientName || null,
        clientEmail: payment.clientEmail || null,
        disputeReason: reason,
        disputeId: dispute.id,
        chargeId: typeof charge === "string" ? charge : charge.id,
        dashboardUrl,
      });
    }
  } catch (notificationError) {
    console.error("Failed to send dispute notifications:", notificationError);
    // Don't throw - we still processed the dispute, notifications are secondary
  }
}

// Handler: Connect Async Payment Succeeded (for delayed payment methods like ACH, SEPA)
async function handleConnectAsyncPaymentSucceeded(session, accountId) {

  const { metadata, payment_intent } = session;

  if (!metadata?.bookingId || !metadata?.tenantId) {
    return;
  }

  // Get the payment intent to access charge details
  let paymentIntentDetails = null;
  if (payment_intent) {
    try {
      paymentIntentDetails = await stripe.paymentIntents.retrieve(
        payment_intent,
        { stripeAccount: accountId }
      );
    } catch (e) {
      console.error("Error fetching payment intent:", e);
    }
  }

  const charge = paymentIntentDetails?.charges?.data?.[0];

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      tenantId: metadata.tenantId,
      contactId: metadata.contactId || null,
      bookingId: metadata.bookingId,
      stripePaymentIntentId: payment_intent || session.id,
      stripeChargeId: charge?.id || null,
      stripeAccountId: accountId,
      stripeReceiptUrl: charge?.receipt_url || null,
      amount: session.amount_total,
      currency: session.currency || "usd",
      depositAmount: metadata.isDeposit === "true" ? parseInt(metadata.depositAmount || "0") : null,
      serviceTotal: parseInt(metadata.serviceTotal || "0") || null,
      clientEmail: session.customer_email || "",
      clientName: session.customer_details?.name || "",
      cardBrand: charge?.payment_method_details?.card?.brand || null,
      cardLast4: charge?.payment_method_details?.card?.last4 || null,
      status: "succeeded",
      capturedAt: new Date(),
      metadata: JSON.stringify(metadata),
    },
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: metadata.bookingId },
    data: {
      status: "confirmed",
      paymentStatus: metadata.isDeposit === "true" ? "deposit_paid" : "paid",
      paymentId: payment.id,
    },
  });


  // Dispatch webhook notification
  dispatchPaymentReceived(metadata.tenantId, {
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    contactName: payment.clientName,
    contactEmail: payment.clientEmail,
    bookingId: payment.bookingId,
    status: payment.status,
    createdAt: payment.createdAt,
  }).catch(console.error);

  // Trigger payment_received workflow
  const tenant = await prisma.tenant.findUnique({ where: { id: metadata.tenantId } });
  if (tenant) {
    triggerWorkflows("payment_received", {
      tenant,
      payment,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
    });
  }
}

// Handler: Connect Async Payment Failed (for delayed payment methods)
async function handleConnectAsyncPaymentFailed(session, accountId) {

  const { metadata, payment_intent } = session;

  if (!metadata?.bookingId || !metadata?.tenantId) {
    return;
  }

  // Update booking status to reflect failed payment
  await prisma.booking.update({
    where: { id: metadata.bookingId },
    data: {
      status: "pending",
      paymentStatus: "failed",
    },
  });


  // Dispatch webhook notification
  dispatchPaymentFailed(metadata.tenantId, {
    bookingId: metadata.bookingId,
    amount: session.amount_total,
    currency: session.currency,
    contactEmail: session.customer_email,
    status: "failed",
  }).catch(console.error);

  // Trigger payment_failed workflow
  const tenant = await prisma.tenant.findUnique({ where: { id: metadata.tenantId } });
  if (tenant) {
    triggerWorkflows("payment_failed", {
      tenant,
      bookingId: metadata.bookingId,
      amount: session.amount_total,
    }).catch((err) => {
      console.error("Error triggering payment_failed workflow:", err);
    });
  }
}

// Handler: Connect Payment Intent Succeeded (for Payment Link payments)
async function handleConnectPaymentIntentSucceeded(paymentIntent, accountId) {

  const { metadata, charges } = paymentIntent;
  const charge = charges?.data?.[0];

  // Handle invoice payment from Stripe Checkout (dashboard-initiated pay links)
  if (metadata?.type === "invoice_payment" && metadata?.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: metadata.invoiceId },
      include: {
        booking: true,
        contact: true,
        tenant: true,
      },
    });

    if (!invoice) {
      console.log(`[webhook] Invoice not found: ${metadata.invoiceId}`);
      return;
    }

    const paymentAmount = paymentIntent.amount;
    const isDeposit = metadata.isDeposit === "true";

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        contactId: invoice.contactId || null,
        clientName: invoice.contactName || invoice.contact?.name || "",
        clientEmail: invoice.contactEmail || invoice.contact?.email || "",
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: charge?.id || null,
        stripeAccountId: accountId,
        stripeReceiptUrl: charge?.receipt_url || null,
        amount: paymentAmount,
        currency: paymentIntent.currency || "usd",
        cardBrand: charge?.payment_method_details?.card?.brand || null,
        cardLast4: charge?.payment_method_details?.card?.last4 || null,
        status: "succeeded",
        metadata: JSON.stringify({
          type: "invoice_payment",
          isDeposit,
          invoiceId: invoice.id,
          paymentOption: metadata.paymentOption,
          source: metadata.source || "checkout_link",
        }),
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    // Create InvoicePayment junction record
    await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        paymentId: payment.id,
        amountApplied: paymentAmount,
      },
    });

    // Calculate new invoice totals
    const newAmountPaid = (invoice.amountPaid || 0) + paymentAmount;
    const newBalanceDue = Math.max(0, invoice.total - newAmountPaid);
    const isPaidInFull = newBalanceDue <= 0;

    // Determine new status
    let newStatus = invoice.status;
    if (isPaidInFull) {
      newStatus = "paid";
    } else if (invoice.status === "draft") {
      // If a payment is made on a draft invoice, transition to "sent"
      newStatus = "sent";
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
        stripePaymentIntentId: paymentIntent.id,
        ...(isDeposit && !invoice.depositPaidAt && { depositPaidAt: new Date() }),
        ...(isPaidInFull && { paidAt: new Date() }),
      },
      include: {
        contact: true,
        booking: true,
      },
    });

    // Update linked booking payment status if exists (1:1 relationship)
    if (invoice.booking) {
      const booking = invoice.booking;
      const newBookingAmountPaid = (booking.bookingAmountPaid || 0) + paymentAmount;
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
          ...(isDeposit && { depositAllocated: (booking.depositAllocated || 0) + paymentAmount }),
        },
      });
    }

    // Dispatch webhook
    dispatchPaymentReceived(invoice.tenantId, {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      contactName: invoice.contactName,
      contactEmail: invoice.contactEmail,
      invoiceId: invoice.id,
      status: payment.status,
      createdAt: payment.createdAt,
    }).catch(console.error);

    // Apply status tags
    applyPaymentStatusTag(prisma, payment.id, invoice.tenantId, "succeeded", {
      tenant: invoice.tenant,
      payment,
    }).catch((err) => {
      console.error("Error applying payment succeeded tag:", err);
    });

    if (isPaidInFull) {
      applyInvoiceStatusTag(prisma, invoice.id, invoice.tenantId, "paid", {
        tenant: invoice.tenant,
        invoice: updatedInvoice,
      }).catch((err) => {
        console.error("Error applying invoice paid tag:", err);
      });
    } else if (isDeposit && !invoice.depositPaidAt) {
      applyInvoiceStatusTag(prisma, invoice.id, invoice.tenantId, "deposit_paid", {
        tenant: invoice.tenant,
        invoice: updatedInvoice,
      }).catch((err) => {
        console.error("Error applying invoice deposit_paid tag:", err);
      });

      // Apply Scheduled tag to linked booking when deposit is paid
      if (invoice.booking && invoice.booking.status === "pending") {
        applyBookingStatusTag(prisma, invoice.booking.id, invoice.tenantId, "scheduled", {
          tenant: invoice.tenant,
        }).catch((err) => {
          console.error("Error applying booking scheduled tag:", err);
        });

        // Trigger booking_scheduled workflow
        triggerWorkflows("booking_scheduled", {
          tenant: invoice.tenant,
          booking: { ...invoice.booking, status: "scheduled" },
          contact: updatedInvoice.contact,
          invoice: updatedInvoice,
        }).catch((err) => {
          console.error("Error triggering booking_scheduled workflow:", err);
        });
      }

      // Trigger invoice_deposit_paid workflow
      triggerWorkflows("invoice_deposit_paid", {
        tenant: invoice.tenant,
        invoice: updatedInvoice,
        contact: updatedInvoice.contact,
        payment,
      }).catch((err) => {
        console.error("Error triggering invoice_deposit_paid workflow:", err);
      });
    }

    // Convert Lead to Client on first payment
    if (invoice.contactId) {
      convertLeadToClient(prisma, invoice.contactId, invoice.tenantId, {
        tenant: invoice.tenant,
        contact: updatedInvoice.contact,
      }).catch((err) => {
        console.error("Error converting lead to client:", err);
      });
    }

    // Trigger workflows
    if (isPaidInFull) {
      triggerWorkflows("invoice_paid", {
        tenant: invoice.tenant,
        invoice: updatedInvoice,
        contact: updatedInvoice.contact,
      }).catch((err) => {
        console.error("Error triggering invoice_paid workflow:", err);
      });
    }

    triggerWorkflows("payment_received", {
      tenant: invoice.tenant,
      payment,
      invoice: updatedInvoice,
      contact: updatedInvoice.contact,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
    });

    return;
  }

  // Handle per-booking balance payment
  if (metadata?.type === "booking_balance" && metadata?.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: metadata.bookingId },
      include: { invoice: true, contact: true, tenant: true },
    });

    if (!booking) {
      return;
    }

    const paymentAmount = paymentIntent.amount;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: booking.tenantId,
        contactId: booking.contactId || null,
        bookingId: booking.id,
        invoiceId: booking.invoiceId || null,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: charge?.id || null,
        stripeAccountId: accountId,
        stripeReceiptUrl: charge?.receipt_url || null,
        amount: paymentAmount,
        currency: paymentIntent.currency || "usd",
        clientEmail: booking.contact?.email || "",
        clientName: booking.contact?.name || "",
        cardBrand: charge?.payment_method_details?.card?.brand || null,
        cardLast4: charge?.payment_method_details?.card?.last4 || null,
        status: "succeeded",
        capturedAt: new Date(),
        metadata: JSON.stringify(metadata),
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    // Update booking payment tracking
    const newAmountPaid = (booking.bookingAmountPaid || 0) + paymentAmount;
    const newBalanceDue = Math.max(0, booking.totalPrice - newAmountPaid);

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        bookingAmountPaid: newAmountPaid,
        bookingBalanceDue: newBalanceDue,
        paymentStatus: newAmountPaid >= booking.totalPrice ? "paid" : "deposit_paid",
        paymentId: payment.id,
      },
    });

    // Update linked invoice if exists
    if (booking.invoiceId && booking.invoice) {
      const newInvoiceAmountPaid = (booking.invoice.amountPaid || 0) + paymentAmount;
      const newInvoiceBalanceDue = booking.invoice.total - newInvoiceAmountPaid;
      const invoicePaidInFull = newInvoiceBalanceDue <= 0;

      // Determine new status
      let newInvoiceStatus = booking.invoice.status;
      if (invoicePaidInFull) {
        newInvoiceStatus = "paid";
      } else if (booking.invoice.status === "draft") {
        newInvoiceStatus = "sent";
      }

      await prisma.invoice.update({
        where: { id: booking.invoiceId },
        data: {
          amountPaid: newInvoiceAmountPaid,
          balanceDue: newInvoiceBalanceDue,
          status: newInvoiceStatus,
          paidAt: invoicePaidInFull ? new Date() : booking.invoice.paidAt,
        },
      });

    }

    // Dispatch webhook
    dispatchPaymentReceived(booking.tenantId, {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      contactName: payment.clientName,
      contactEmail: payment.clientEmail,
      bookingId: booking.id,
      status: payment.status,
      createdAt: payment.createdAt,
    }).catch(console.error);

    // Apply status tags
    applyPaymentStatusTag(prisma, payment.id, booking.tenantId, "succeeded", {
      tenant: booking.tenant,
      payment,
    }).catch((err) => {
      console.error("Error applying payment succeeded tag:", err);
    });

    // Convert Lead to Client on first payment
    if (booking.contactId) {
      convertLeadToClient(prisma, booking.contactId, booking.tenantId, {
        tenant: booking.tenant,
        contact: booking.contact,
      }).catch((err) => {
        console.error("Error converting lead to client:", err);
      });
    }

    // Trigger payment_received workflow
    triggerWorkflows("payment_received", {
      tenant: booking.tenant,
      payment,
      contact: booking.contact,
      booking,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
    });

    return;
  }

  // Handle deposit payment for invoice with multiple bookings
  if (metadata?.type === "deposit_payment" && metadata?.invoiceId) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: metadata.invoiceId },
      include: {
        booking: true,
        contact: true,
        tenant: true,
      },
    });

    if (!invoice) {
      return;
    }

    const depositAmount = paymentIntent.amount;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        contactId: invoice.contactId || null,
        invoiceId: invoice.id,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: charge?.id || null,
        stripeAccountId: accountId,
        stripeReceiptUrl: charge?.receipt_url || null,
        amount: depositAmount,
        depositAmount: depositAmount,
        currency: paymentIntent.currency || "usd",
        clientEmail: invoice.contactEmail || "",
        clientName: invoice.contactName || "",
        cardBrand: charge?.payment_method_details?.card?.brand || null,
        cardLast4: charge?.payment_method_details?.card?.last4 || null,
        status: "succeeded",
        capturedAt: new Date(),
        metadata: JSON.stringify(metadata),
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    // Update linked booking with deposit (1:1 relationship)
    if (invoice.booking) {
      const booking = invoice.booking;
      const newDepositAllocated = (booking.depositAllocated || 0) + depositAmount;
      const newBookingAmountPaid = (booking.bookingAmountPaid || 0) + depositAmount;
      const newBookingBalanceDue = Math.max(0, booking.totalPrice - newBookingAmountPaid);

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          depositAllocated: newDepositAllocated,
          bookingAmountPaid: newBookingAmountPaid,
          bookingBalanceDue: newBookingBalanceDue,
          paymentStatus: calculateBookingPaymentStatus({
            totalPrice: booking.totalPrice,
            depositAllocated: newDepositAllocated,
            bookingAmountPaid: newBookingAmountPaid,
          }),
        },
      });
    }

    // Update invoice
    const newAmountPaid = (invoice.amountPaid || 0) + depositAmount;
    const newBalanceDue = invoice.total - newAmountPaid;
    const isPaidInFull = newBalanceDue <= 0;

    // Determine new status - use valid invoice statuses
    let newStatus = invoice.status;
    if (isPaidInFull) {
      newStatus = "paid";
    } else if (invoice.status === "draft") {
      newStatus = "sent";
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newStatus,
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        depositPaidAt: new Date(),
        paidAt: isPaidInFull ? new Date() : null,
      },
    });

    // Dispatch webhook
    dispatchPaymentReceived(invoice.tenantId, {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      contactName: payment.clientName,
      contactEmail: payment.clientEmail,
      invoiceId: invoice.id,
      status: payment.status,
      createdAt: payment.createdAt,
    }).catch(console.error);

    // Apply status tags
    applyPaymentStatusTag(prisma, payment.id, invoice.tenantId, "succeeded", {
      tenant: invoice.tenant,
      payment,
    }).catch((err) => {
      console.error("Error applying payment succeeded tag:", err);
    });

    // Apply invoice deposit_paid tag
    applyInvoiceStatusTag(prisma, invoice.id, invoice.tenantId, "deposit_paid", {
      tenant: invoice.tenant,
      invoice,
    }).catch((err) => {
      console.error("Error applying invoice deposit_paid tag:", err);
    });

    // Apply Scheduled tag to linked booking when deposit is paid
    if (invoice.booking && invoice.booking.status === "pending") {
      applyBookingStatusTag(prisma, invoice.booking.id, invoice.tenantId, "scheduled", {
        tenant: invoice.tenant,
      }).catch((err) => {
        console.error("Error applying booking scheduled tag:", err);
      });

      // Trigger booking_scheduled workflow
      triggerWorkflows("booking_scheduled", {
        tenant: invoice.tenant,
        booking: { ...invoice.booking, status: "scheduled" },
        contact: invoice.contact,
        invoice,
      }).catch((err) => {
        console.error("Error triggering booking_scheduled workflow:", err);
      });
    }

    // Convert Lead to Client on first payment
    if (invoice.contactId) {
      convertLeadToClient(prisma, invoice.contactId, invoice.tenantId, {
        tenant: invoice.tenant,
        contact: invoice.contact,
      }).catch((err) => {
        console.error("Error converting lead to client:", err);
      });
    }

    // Trigger payment_received workflow
    triggerWorkflows("payment_received", {
      tenant: invoice.tenant,
      payment,
      contact: invoice.contact,
      invoice,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
    });

    // Trigger invoice_deposit_paid workflow
    triggerWorkflows("invoice_deposit_paid", {
      tenant: invoice.tenant,
      invoice,
      contact: invoice.contact,
      payment,
    }).catch((err) => {
      console.error("Error triggering invoice_deposit_paid workflow:", err);
    });

    return;
  }

  // Check if this is a balance payment (from Payment Link) - full invoice balance
  if (metadata?.type === "balance_payment" && metadata?.invoiceNumber) {
    // Find the invoice by invoice number
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: metadata.invoiceNumber,
      },
      include: {
        booking: true,
        contact: true,
        tenant: true,
      },
    });

    if (!invoice) {
      return;
    }

    // Create payment record for balance payment
    const payment = await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        contactId: invoice.contactId || null,
        bookingId: invoice.bookingId || null,
        invoiceId: invoice.id,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: charge?.id || null,
        stripeAccountId: accountId,
        stripeReceiptUrl: charge?.receipt_url || null,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency || "usd",
        clientEmail: invoice.contactEmail || "",
        clientName: invoice.contactName || "",
        cardBrand: charge?.payment_method_details?.card?.brand || null,
        cardLast4: charge?.payment_method_details?.card?.last4 || null,
        status: "succeeded",
        capturedAt: new Date(),
        metadata: JSON.stringify(metadata),
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    // Update invoice as paid
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        amountPaid: invoice.total,
        balanceDue: 0,
        paidAt: new Date(),
      },
    });

    // Update linked booking to fully paid (1:1 relationship)
    if (invoice.booking) {
      await prisma.booking.update({
        where: { id: invoice.booking.id },
        data: {
          paymentStatus: "paid",
          bookingAmountPaid: invoice.booking.totalPrice,
          bookingBalanceDue: 0,
        },
      });
    } else if (invoice.bookingId) {
      // Fallback for single booking
      await prisma.booking.update({
        where: { id: invoice.bookingId },
        data: {
          paymentStatus: "paid",
        },
      });
    }


    // Dispatch webhook
    dispatchInvoicePaid(invoice.tenantId, {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      contactName: invoice.contactName,
      contactEmail: invoice.contactEmail,
      total: invoice.total,
      paidAt: new Date(),
      status: "paid",
    }).catch(console.error);

    // Apply status tags
    applyPaymentStatusTag(prisma, payment.id, invoice.tenantId, "succeeded", {
      tenant: invoice.tenant,
      payment,
    }).catch((err) => {
      console.error("Error applying payment succeeded tag:", err);
    });

    applyInvoiceStatusTag(prisma, invoice.id, invoice.tenantId, "paid", {
      tenant: invoice.tenant,
      invoice,
    }).catch((err) => {
      console.error("Error applying invoice paid tag:", err);
    });

    // Convert Lead to Client on first payment
    if (invoice.contactId) {
      convertLeadToClient(prisma, invoice.contactId, invoice.tenantId, {
        tenant: invoice.tenant,
        contact: invoice.contact,
      }).catch((err) => {
        console.error("Error converting lead to client:", err);
      });
    }

    // Trigger payment_received and invoice_paid workflows
    triggerWorkflows("payment_received", {
      tenant: invoice.tenant,
      payment,
      contact: invoice.contact,
      invoice,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
    });

    triggerWorkflows("invoice_paid", {
      tenant: invoice.tenant,
      invoice,
      contact: invoice.contact,
    }).catch((err) => {
      console.error("Error triggering invoice_paid workflow:", err);
    });

    return;
  }

  // Handle public booking payment (from customer checkout)
  if (metadata?.type === "booking_payment" && metadata?.bookingId) {
    console.log("[webhook] Processing booking_payment for booking:", metadata.bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: metadata.bookingId },
      include: {
        contact: true,
        tenant: true,
        service: true,
        package: true,
        services: { include: { service: true } },
        packages: { include: { package: true } },
        invoice: true, // Check if invoice already exists
      },
    });

    if (!booking) {
      console.log("[webhook] Booking not found:", metadata.bookingId);
      return;
    }

    // Check if payment already processed (idempotency)
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (existingPayment) {
      console.log("[webhook] Payment already processed:", paymentIntent.id);
      return;
    }

    const paymentAmount = paymentIntent.amount;
    const isDeposit = metadata.isDeposit === "true";
    const serviceTotal = parseInt(metadata.serviceTotal, 10) || booking.totalPrice;

    // Build service name for invoice
    const allServices = [];
    if (booking.services?.length > 0) {
      allServices.push(...booking.services.map((bs) => bs.service.name));
    } else if (booking.service) {
      allServices.push(booking.service.name);
    }
    if (booking.packages?.length > 0) {
      allServices.push(...booking.packages.map((bp) => bp.package.name));
    } else if (booking.package) {
      allServices.push(booking.package.name);
    }
    const serviceName = allServices.join(", ") || "Service";

    // Create Payment record
    const payment = await prisma.payment.create({
      data: {
        tenantId: booking.tenantId,
        contactId: booking.contactId || null,
        bookingId: booking.id,
        stripePaymentIntentId: paymentIntent.id,
        stripeChargeId: charge?.id || null,
        stripeAccountId: accountId,
        stripeReceiptUrl: charge?.receipt_url || null,
        amount: paymentAmount,
        currency: paymentIntent.currency || "usd",
        clientEmail: booking.contact?.email || "",
        clientName: booking.contact?.name || "",
        cardBrand: charge?.payment_method_details?.card?.brand || null,
        cardLast4: charge?.payment_method_details?.card?.last4 || null,
        status: "succeeded",
        capturedAt: new Date(),
        metadata: JSON.stringify({
          type: "booking_payment",
          isDeposit,
          serviceTotal,
          source: "public_checkout",
        }),
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    console.log("[webhook] Created payment record:", payment.id);

    // Auto-create Invoice for the booking (if doesn't exist)
    let invoice = booking.invoice;
    if (!invoice) {
      // Generate invoice number
      const invoiceCount = await prisma.invoice.count({
        where: { tenantId: booking.tenantId },
      });
      const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(5, "0")}`;

      // Calculate deposit percent if this was a deposit payment
      const depositPercent = isDeposit ? Math.round((paymentAmount / serviceTotal) * 100) : null;

      invoice = await prisma.invoice.create({
        data: {
          tenantId: booking.tenantId,
          contactId: booking.contactId,
          invoiceNumber,
          status: paymentAmount >= serviceTotal ? "paid" : "sent", // Paid if full, sent if deposit
          dueDate: new Date(), // Due immediately for booking payments
          subtotal: serviceTotal,
          total: serviceTotal,
          depositPercent,
          depositAmount: isDeposit ? paymentAmount : null,
          depositPaidAt: isDeposit ? new Date() : null,
          amountPaid: paymentAmount,
          balanceDue: Math.max(0, serviceTotal - paymentAmount),
          paidAt: paymentAmount >= serviceTotal ? new Date() : null,
          sentAt: new Date(),
          lineItems: [
            {
              description: serviceName,
              quantity: 1,
              unitPrice: serviceTotal,
              amount: serviceTotal,
            },
          ],
          contactName: booking.contact?.name || "",
          contactEmail: booking.contact?.email || "",
          notes: `Auto-generated from booking on ${new Date().toLocaleDateString()}`,
        },
        include: {
          contact: true,
          tenant: true,
        },
      });

      console.log("[webhook] Created auto-invoice:", invoice.id, invoice.invoiceNumber);
    } else {
      // Invoice exists - update it with the payment
      const newAmountPaid = (invoice.amountPaid || 0) + paymentAmount;
      const newBalanceDue = Math.max(0, invoice.total - newAmountPaid);
      const isPaidInFull = newBalanceDue <= 0;

      invoice = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: isPaidInFull ? "paid" : invoice.status,
          paidAt: isPaidInFull ? new Date() : invoice.paidAt,
          ...(isDeposit && !invoice.depositPaidAt && { depositPaidAt: new Date() }),
        },
        include: {
          contact: true,
          tenant: true,
        },
      });

      console.log("[webhook] Updated existing invoice:", invoice.id);
    }

    // Create InvoicePayment junction record
    await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        paymentId: payment.id,
        amountApplied: paymentAmount,
      },
    });

    // Update booking with invoice link, payment status
    // Payment sets status to "scheduled" - "confirmed" only comes from contact confirmation email
    const newBookingAmountPaid = paymentAmount;
    const newBookingBalanceDue = Math.max(0, serviceTotal - paymentAmount);
    const isPaidInFull = newBookingBalanceDue <= 0;

    // Generate confirmation token for secure email links
    const confirmationToken = createId();

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        invoiceId: invoice.id,
        paymentId: payment.id,
        status: "scheduled",
        paymentStatus: isPaidInFull ? "paid" : "deposit_paid",
        bookingAmountPaid: newBookingAmountPaid,
        bookingBalanceDue: newBookingBalanceDue,
        confirmationToken,
        ...(isDeposit && { depositAllocated: paymentAmount }),
      },
    });

    console.log("[webhook] Updated booking:", booking.id, "status: scheduled, paymentStatus:", isPaidInFull ? "paid" : "deposit_paid");

    // Dispatch webhooks
    dispatchPaymentReceived(booking.tenantId, {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      contactName: payment.clientName,
      contactEmail: payment.clientEmail,
      bookingId: booking.id,
      invoiceId: invoice.id,
      status: payment.status,
      createdAt: payment.createdAt,
    }).catch(console.error);

    // Apply status tags
    applyPaymentStatusTag(prisma, payment.id, booking.tenantId, "succeeded", {
      tenant: booking.tenant,
      payment,
    }).catch((err) => {
      console.error("Error applying payment succeeded tag:", err);
    });

    // Apply booking scheduled tag
    applyBookingStatusTag(prisma, booking.id, booking.tenantId, "scheduled", {
      tenant: booking.tenant,
    }).catch((err) => {
      console.error("Error applying booking scheduled tag:", err);
    });

    if (isPaidInFull) {
      applyInvoiceStatusTag(prisma, invoice.id, booking.tenantId, "paid", {
        tenant: booking.tenant,
        invoice,
      }).catch((err) => {
        console.error("Error applying invoice paid tag:", err);
      });
    } else if (isDeposit) {
      applyInvoiceStatusTag(prisma, invoice.id, booking.tenantId, "deposit_paid", {
        tenant: booking.tenant,
        invoice,
      }).catch((err) => {
        console.error("Error applying invoice deposit_paid tag:", err);
      });

      // Trigger invoice_deposit_paid workflow for deposit payments
      triggerWorkflows("invoice_deposit_paid", {
        tenant: booking.tenant,
        invoice,
        contact: booking.contact,
        payment,
      }).catch((err) => {
        console.error("Error triggering invoice_deposit_paid workflow:", err);
      });
    }

    // Convert Lead to Client on first payment
    if (booking.contactId) {
      convertLeadToClient(prisma, booking.contactId, booking.tenantId, {
        tenant: booking.tenant,
        contact: booking.contact,
      }).catch((err) => {
        console.error("Error converting lead to client:", err);
      });
    }

    // Trigger workflows
    triggerWorkflows("payment_received", {
      tenant: booking.tenant,
      payment,
      booking,
      invoice,
      contact: booking.contact,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
    });

    // Trigger booking_scheduled workflow (confirmed only comes from contact email confirmation)
    triggerWorkflows("booking_scheduled", {
      tenant: booking.tenant,
      booking: { ...booking, status: "scheduled" },
      contact: booking.contact,
    }).catch((err) => {
      console.error("Error triggering booking_scheduled workflow:", err);
    });

    if (isPaidInFull) {
      triggerWorkflows("invoice_paid", {
        tenant: booking.tenant,
        invoice,
        contact: booking.contact,
      }).catch((err) => {
        console.error("Error triggering invoice_paid workflow:", err);
      });
    }

    return;
  }
}
