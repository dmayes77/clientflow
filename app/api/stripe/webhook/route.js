import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import {
  dispatchPaymentReceived,
  dispatchPaymentFailed,
  dispatchInvoicePaid,
} from "@/lib/webhooks";

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

  try {
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
        clientEmail: paymentIntent.receipt_email || metadata.clientEmail || "",
        clientName: metadata.clientName || "",
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
    clientName: payment.clientName,
    clientEmail: payment.clientEmail,
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
    clientEmail: metadata.clientEmail,
    status: "failed",
  }).catch(console.error);
}

// Handler: Checkout Session Completed
async function handleCheckoutSessionCompleted(session) {
  console.log("Checkout completed:", session.id);

  const { metadata, customer, subscription } = session;

  if (!metadata?.tenantId) {
    console.log("No tenantId in metadata");
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
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
      updateData.planType = "professional";
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC) {
      updateData.planType = "basic";
    }
  }

  await prisma.tenant.update({
    where: { id: metadata.tenantId },
    data: updateData,
  });
}

// Handler: Subscription Updated
async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);

  const tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!tenant) {
    console.log("No tenant found for subscription");
    return;
  }

  const updateData = {
    subscriptionStatus: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };

  // Check for plan changes
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
    updateData.planType = "professional";
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC) {
    updateData.planType = "basic";
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
  });
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
        clientName: existingInvoice.clientName,
        clientEmail: existingInvoice.clientEmail,
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
