import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  dispatchPaymentReceived,
  dispatchPaymentFailed,
  dispatchInvoicePaid,
} from "@/lib/webhooks";
import { sendDisputeNotification, sendTrialEndingNotification } from "@/lib/email";
import { triggerEventAlert, triggerEventAlertByStripeCustomer } from "@/lib/alert-runner";
import { sendPaymentConfirmation } from "@/lib/send-system-email";
import { allocateDepositToBookings } from "@/lib/payment-allocation";
import { triggerWorkflows } from "@/lib/workflow-executor";

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

  const { metadata } = session;

  // This is handled by verify-payment route, but we can use this as a backup
  // to ensure booking status is updated even if the customer doesn't reach the success page

  if (!metadata?.bookingId || !metadata?.tenantId) {
    return;
  }

  // Check if payment was already processed
  const existingPayment = await prisma.payment.findFirst({
    where: {
      bookingId: metadata.bookingId,
      status: "succeeded",
    },
  });

  if (existingPayment) {
    return;
  }

  // Update booking status to confirmed
  await prisma.booking.update({
    where: { id: metadata.bookingId },
    data: {
      status: "confirmed",
      paymentStatus: metadata.isDeposit === "true" ? "deposit_paid" : "paid",
    },
  });

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

  // Send payment confirmation email (async, don't wait)
  if (updatedPayment.contact?.email) {
    sendPaymentConfirmation(updatedPayment).catch((err) => {
      console.error("Error sending payment confirmation email:", err);
    });
  }

  // Trigger payment_received workflow
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

  const { payment_intent, amount_refunded, refunded } = charge;

  if (!payment_intent) {
    return;
  }

  // Find payment record
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentIntentId: typeof payment_intent === "string" ? payment_intent : payment_intent.id,
    },
  });

  if (!payment) {
    return;
  }

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

  // Update booking payment status if applicable
  if (payment.bookingId) {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: isFullRefund ? "refunded" : "partial_refund",
      },
    });
  }

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

    // Send payment confirmation email
    if (payment.contact?.email) {
      sendPaymentConfirmation(payment).catch((err) => {
        console.error("Error sending payment confirmation email:", err);
      });
    }

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

      await prisma.invoice.update({
        where: { id: booking.invoiceId },
        data: {
          amountPaid: newInvoiceAmountPaid,
          balanceDue: newInvoiceBalanceDue,
          status: newInvoiceBalanceDue <= 0 ? "paid" : booking.invoice.status,
          paidAt: newInvoiceBalanceDue <= 0 ? new Date() : booking.invoice.paidAt,
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
        bookings: true,
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

    // Send payment confirmation email
    if (payment.contact?.email) {
      sendPaymentConfirmation(payment).catch((err) => {
        console.error("Error sending payment confirmation email:", err);
      });
    }

    // Allocate deposit proportionally to bookings
    if (invoice.bookings && invoice.bookings.length > 0) {
      const bookingUpdates = allocateDepositToBookings(invoice, invoice.bookings);

      // Update each booking with allocated deposit
      await Promise.all(
        bookingUpdates.map(({ bookingId, updateData }) =>
          prisma.booking.update({
            where: { id: bookingId },
            data: updateData,
          })
        )
      );
    }

    // Update invoice
    const newAmountPaid = (invoice.amountPaid || 0) + depositAmount;
    const newBalanceDue = invoice.total - newAmountPaid;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: newBalanceDue <= 0 ? "paid" : "deposit_paid",
        amountPaid: newAmountPaid,
        balanceDue: newBalanceDue,
        paidAt: newBalanceDue <= 0 ? new Date() : null,
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

    // Trigger payment_received workflow
    triggerWorkflows("payment_received", {
      tenant: invoice.tenant,
      payment,
      contact: invoice.contact,
      invoice,
    }).catch((err) => {
      console.error("Error triggering payment_received workflow:", err);
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
        bookings: true,
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

    // Send payment confirmation email (async, don't wait)
    if (payment.contact?.email) {
      sendPaymentConfirmation(payment).catch((err) => {
        console.error("Error sending payment confirmation email:", err);
      });
    }

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

    // Update all linked bookings to fully paid
    if (invoice.bookings && invoice.bookings.length > 0) {
      await Promise.all(
        invoice.bookings.map((booking) =>
          prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: "paid",
              bookingAmountPaid: booking.totalPrice,
              bookingBalanceDue: 0,
            },
          })
        )
      );
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
  }
}
