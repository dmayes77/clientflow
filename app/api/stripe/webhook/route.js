import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object, event.account);
        break;

      // Subscription events for ClientFlow billing
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent) {
  // Find payment by payment intent ID
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { bookings: true },
  });

  if (!payment) {
    console.error(`Payment not found for intent: ${paymentIntent.id}`);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "succeeded",
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || "{}"),
        succeededAt: new Date().toISOString(),
      }),
    },
  });

  // Update all associated bookings
  if (payment.bookings.length > 0) {
    await prisma.booking.updateMany({
      where: { paymentId: payment.id },
      data: { paymentStatus: "paid" },
    });
  }

  console.log(`Payment succeeded: ${payment.id}`);
}

async function handlePaymentFailed(paymentIntent) {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { bookings: true },
  });

  if (!payment) {
    console.error(`Payment not found for intent: ${paymentIntent.id}`);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "failed",
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || "{}"),
        failedAt: new Date().toISOString(),
        failureReason: paymentIntent.last_payment_error?.message,
      }),
    },
  });

  // Update bookings
  if (payment.bookings.length > 0) {
    await prisma.booking.updateMany({
      where: { paymentId: payment.id },
      data: { paymentStatus: "failed" },
    });
  }

  console.log(`Payment failed: ${payment.id}`);
}

async function handlePaymentCanceled(paymentIntent) {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { bookings: true },
  });

  if (!payment) {
    console.error(`Payment not found for intent: ${paymentIntent.id}`);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "canceled",
      metadata: JSON.stringify({
        ...JSON.parse(payment.metadata || "{}"),
        canceledAt: new Date().toISOString(),
      }),
    },
  });

  // Update bookings
  if (payment.bookings.length > 0) {
    await prisma.booking.updateMany({
      where: { paymentId: payment.id },
      data: { paymentStatus: "canceled" },
    });
  }

  console.log(`Payment canceled: ${payment.id}`);
}

async function handleAccountUpdated(account, accountId) {
  // Find tenant by Stripe account ID
  const tenant = await prisma.tenant.findFirst({
    where: { stripeAccountId: accountId || account.id },
  });

  if (!tenant) {
    console.log(`Tenant not found for account: ${accountId || account.id}`);
    return;
  }

  // Update tenant account status
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeAccountStatus: account.charges_enabled ? "active" : "pending",
      stripeOnboardingComplete: account.details_submitted && account.charges_enabled,
    },
  });

  console.log(`Account updated: ${tenant.id}`);
}

// ClientFlow Subscription Handlers
async function handleCheckoutCompleted(session) {
  if (session.mode !== "subscription") {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const customerId = session.customer;

  // Find tenant by Stripe customer ID
  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  // Determine status based on trial
  const status = subscription.status === "trialing" ? "trialing" : subscription.status;
  const planType = subscription.metadata.planType || "professional";

  // Update tenant subscription info
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: status,
      planType: planType,
    },
  });

  console.log(`Checkout completed for tenant: ${tenant.id}, Status: ${status}`);
}

async function handleSubscriptionCreated(subscription) {
  const customerId = subscription.customer;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  const status = subscription.status;
  const planType = subscription.metadata.planType || "professional";

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: status,
      planType: planType,
    },
  });

  console.log(`Subscription created for tenant: ${tenant.id}, Status: ${status}`);
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  const status = subscription.status;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: status,
    },
  });

  console.log(`Subscription updated for tenant: ${tenant.id}, Status: ${status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: "canceled",
    },
  });

  console.log(`Subscription canceled for tenant: ${tenant.id}`);
}

async function handleTrialWillEnd(subscription) {
  const customerId = subscription.customer;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!tenant) {
    console.error(`Tenant not found for customer: ${customerId}`);
    return;
  }

  // TODO: Send email notification about trial ending
  console.log(`Trial will end soon for tenant: ${tenant.id}`);
  // This is where you would send an email reminder
}
