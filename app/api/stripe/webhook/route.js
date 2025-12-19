import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  dispatchPaymentReceived,
  dispatchPaymentFailed,
  dispatchInvoicePaid,
} from "@/lib/webhooks";
import { sendDisputeNotification } from "@/lib/email";

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
          console.log(`Unhandled Connect event type: ${event.type}`);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook ${event.type}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Handler: Payment Intent Succeeded
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log("Payment succeeded:", paymentIntent.id);

  const { metadata } = paymentIntent;

  if (!metadata?.tenantId) {
    console.log("No tenantId in metadata, skipping");
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
  console.log("Payment failed:", paymentIntent.id);

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
  console.log("Checkout completed:", session.id);

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
    console.log("No tenant found for checkout session");
    return;
  }

  // Update tenant with subscription info
  const updateData = {
    stripeCustomerId: customer,
    subscriptionStatus: "trialing",
  };

  if (subscription) {
    updateData.stripeSubscriptionId = subscription;

    // Get subscription details
    const sub = await stripe.subscriptions.retrieve(subscription);
    updateData.currentPeriodEnd = new Date(sub.current_period_end * 1000);

    if (sub.status === "active") {
      updateData.subscriptionStatus = "active";
    }

    // Determine plan type from price
    const priceId = sub.items.data[0]?.price.id;
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL) {
      updateData.planType = "professional";
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PLATFORM) {
      updateData.planType = "platform";
    }
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
  });

  console.log(`Updated tenant ${tenant.id} with subscription ${subscription}`);
}

// Handler: Subscription Updated/Created
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log("Subscription updated:", subscription.id);

    // Get customer ID (can be string or expanded object)
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

    console.log("Looking for tenant with customerId:", customerId);

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
      console.log("No tenant found for subscription", subscription.id);
      return;
    }

    console.log("Found tenant:", tenant.id);

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

    // Check for plan changes
    const priceId = subscription.items?.data?.[0]?.price?.id;
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL) {
      updateData.planType = "professional";
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PLATFORM) {
      updateData.planType = "platform";
    }

    console.log("Updating tenant with:", updateData);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
    });

    console.log("Subscription handler completed successfully");
  } catch (error) {
    console.error("Error in handleSubscriptionUpdated:", error);
    throw error;
  }
}

// Handler: Subscription Deleted
async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);

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
}

// Handler: Trial Will End
async function handleTrialWillEnd(subscription) {
  console.log("Trial ending soon:", subscription.id);

  const tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) {
    return;
  }

  // TODO: Send trial ending notification email
  console.log(`Trial ending for tenant ${tenant.id} in 3 days`);
}

// Handler: Invoice Payment Succeeded
async function handleInvoicePaymentSucceeded(invoice) {
  console.log("Invoice payment succeeded:", invoice.id);

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
  console.log("Invoice payment failed:", invoice.id);

  if (invoice.subscription) {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (tenant) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { subscriptionStatus: "past_due" },
      });
    }
  }
}

// Handler: Stripe Connect Account Updated
async function handleAccountUpdated(account) {
  console.log("Account updated:", account.id);

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
  console.log("Connect checkout completed:", session.id, "for account:", accountId);

  const { metadata } = session;

  // This is handled by verify-payment route, but we can use this as a backup
  // to ensure booking status is updated even if the customer doesn't reach the success page

  if (!metadata?.bookingId || !metadata?.tenantId) {
    console.log("No booking/tenant in Connect checkout session metadata");
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
    console.log("Payment already processed for booking:", metadata.bookingId);
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

  console.log("Booking confirmed via Connect webhook:", metadata.bookingId);
}

// Handler: Connect Charge Succeeded - Capture card details for chargeback evidence
async function handleConnectChargeSucceeded(charge, accountId) {
  console.log("Connect charge succeeded:", charge.id, "for account:", accountId);

  const { payment_intent, metadata } = charge;

  if (!payment_intent) {
    console.log("No payment_intent on charge, skipping");
    return;
  }

  // Find existing payment record
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentIntentId: typeof payment_intent === "string" ? payment_intent : payment_intent.id,
    },
  });

  if (!payment) {
    console.log("No payment record found for charge:", charge.id);
    return;
  }

  // Update payment with card details for chargeback evidence
  const cardDetails = charge.payment_method_details?.card;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      stripeChargeId: charge.id,
      stripeReceiptUrl: charge.receipt_url || null,
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null,
      capturedAt: charge.captured ? new Date() : null,
    },
  });

  console.log("Payment updated with charge details:", payment.id);
}

// Handler: Connect Charge Refunded
async function handleConnectChargeRefunded(charge, accountId) {
  console.log("Connect charge refunded:", charge.id, "for account:", accountId);

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
    console.log("No payment record found for refund:", charge.id);
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

  console.log("Payment marked as refunded:", payment.id, newStatus);
}

// Handler: Connect Dispute Created
async function handleConnectDisputeCreated(dispute, accountId) {
  console.log("Connect dispute created:", dispute.id, "for account:", accountId);

  const { charge, reason, status, amount } = dispute;

  if (!charge) {
    return;
  }

  // Find payment by charge ID
  const payment = await prisma.payment.findFirst({
    where: { stripeChargeId: typeof charge === "string" ? charge : charge.id },
  });

  if (!payment) {
    console.log("No payment found for disputed charge:", charge);
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

  console.log("Payment marked as disputed:", payment.id, reason);

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
    console.log("In-app dispute alert created for tenant:", payment.tenantId);

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
      console.log("Dispute email notification sent to:", tenant.email);
    }
  } catch (notificationError) {
    console.error("Failed to send dispute notifications:", notificationError);
    // Don't throw - we still processed the dispute, notifications are secondary
  }
}

// Handler: Connect Async Payment Succeeded (for delayed payment methods like ACH, SEPA)
async function handleConnectAsyncPaymentSucceeded(session, accountId) {
  console.log("Connect async payment succeeded:", session.id, "for account:", accountId);

  const { metadata, payment_intent } = session;

  if (!metadata?.bookingId || !metadata?.tenantId) {
    console.log("No booking/tenant in async payment session metadata");
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

  console.log("Async payment processed, booking confirmed:", metadata.bookingId);

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
}

// Handler: Connect Async Payment Failed (for delayed payment methods)
async function handleConnectAsyncPaymentFailed(session, accountId) {
  console.log("Connect async payment failed:", session.id, "for account:", accountId);

  const { metadata, payment_intent } = session;

  if (!metadata?.bookingId || !metadata?.tenantId) {
    console.log("No booking/tenant in failed async payment session metadata");
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

  console.log("Async payment failed for booking:", metadata.bookingId);

  // Dispatch webhook notification
  dispatchPaymentFailed(metadata.tenantId, {
    bookingId: metadata.bookingId,
    amount: session.amount_total,
    currency: session.currency,
    contactEmail: session.customer_email,
    status: "failed",
  }).catch(console.error);
}

// Handler: Connect Payment Intent Succeeded (for Payment Link payments)
async function handleConnectPaymentIntentSucceeded(paymentIntent, accountId) {
  console.log("Connect payment intent succeeded:", paymentIntent.id, "for account:", accountId);

  const { metadata, charges } = paymentIntent;

  // Check if this is a balance payment (from Payment Link)
  if (metadata?.type === "balance_payment" && metadata?.invoiceNumber) {
    // Find the invoice by invoice number
    const invoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: metadata.invoiceNumber,
      },
      include: {
        booking: true,
      },
    });

    if (!invoice) {
      console.log("No invoice found for balance payment:", metadata.invoiceNumber);
      return;
    }

    // Get charge details
    const charge = charges?.data?.[0];

    // Create payment record for balance payment
    const payment = await prisma.payment.create({
      data: {
        tenantId: invoice.tenantId,
        contactId: invoice.contactId || null,
        bookingId: invoice.bookingId || null,
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
    });

    // Update invoice as paid
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "paid",
        amountPaid: invoice.total,
        balanceDue: 0,
      },
    });

    // Update booking to fully paid
    if (invoice.bookingId) {
      await prisma.booking.update({
        where: { id: invoice.bookingId },
        data: {
          paymentStatus: "paid",
        },
      });
    }

    console.log("Balance payment processed, invoice paid:", invoice.invoiceNumber);

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
  }
}
