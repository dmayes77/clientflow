import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { resend } from "@/lib/resend";
import { MagicLinkEmail } from "@/emails/magic-link";

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
  const customerEmail = session.customer_details?.email || session.customer_email;

  if (!customerEmail) {
    console.error("No customer email found in checkout session");
    return;
  }

  // Determine status and plan type
  const status = subscription.status === "trialing" ? "trialing" : subscription.status;
  const planType = subscription.metadata.planType || "professional";

  // Check if tenant already exists for this customer
  let tenant = await prisma.tenant.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (tenant) {
    // Tenant already exists, just update subscription status
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: status,
        planType: planType,
      },
    });

    console.log(`Checkout completed for existing tenant: ${tenant.id}, Status: ${status}`);
    return;
  }

  // Check if user already exists in Clerk (signed up before paying)
  try {
    const client = await clerkClient();

    // Search for existing Clerk user by email
    const existingUsers = await client.users.getUserList({
      emailAddress: [customerEmail],
    });

    let clerkUser = existingUsers.data?.[0];
    let clerkOrg;
    let isNewUser = false;

    if (clerkUser) {
      // User already exists in Clerk (signed up first, then paid)
      console.log(`Found existing Clerk user for ${customerEmail}: ${clerkUser.id}`);

      // Get their organization memberships
      const orgMemberships = await client.users.getOrganizationMembershipList({
        userId: clerkUser.id,
      });

      if (orgMemberships.data?.length > 0) {
        // Use their first organization
        const orgId = orgMemberships.data[0].organization.id;
        clerkOrg = await client.organizations.getOrganization({ organizationId: orgId });
        console.log(`Using existing organization: ${clerkOrg.id}`);
      } else {
        // User exists but has no org - create one
        clerkOrg = await client.organizations.createOrganization({
          name: `${customerEmail.split('@')[0]}'s Business`,
          createdBy: clerkUser.id,
        });
        console.log(`Created organization for existing user: ${clerkOrg.id}`);
      }

      // Check if tenant already exists for this org
      tenant = await prisma.tenant.findFirst({
        where: { clerkOrgId: clerkOrg.id },
      });

      if (tenant) {
        // Update existing tenant with Stripe info and email
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            email: customerEmail,
            stripeCustomerId: customerId,
            subscriptionStatus: status,
            planType: planType,
          },
        });
        console.log(`Updated existing tenant ${tenant.id} with Stripe subscription`);
        return;
      }
    } else {
      // NEW USER: Email-first checkout (no Clerk account yet)
      isNewUser = true;
      const nameFromEmail = customerEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();

      clerkUser = await client.users.createUser({
        emailAddress: [customerEmail],
        skipPasswordRequirement: true,
        firstName: nameFromEmail || "User",
        lastName: "",
      });

      clerkOrg = await client.organizations.createOrganization({
        name: `${customerEmail.split('@')[0]}'s Business`,
        createdBy: clerkUser.id,
      });

      console.log(`Created new Clerk user ${clerkUser.id} and org ${clerkOrg.id}`);
    }

    // Create tenant in our database
    tenant = await prisma.tenant.create({
      data: {
        name: clerkOrg.name,
        email: customerEmail,
        clerkOrgId: clerkOrg.id,
        stripeCustomerId: customerId,
        subscriptionStatus: status,
        planType: planType,
      },
    });

    console.log(`Created tenant ${tenant.id} for ${customerEmail}, Status: ${status}`);

    // Only send magic link email for truly new users (email-first checkout)
    if (isNewUser) {
      const signInToken = await client.signInTokens.createSignInToken({
        userId: clerkUser.id,
        expiresInSeconds: 86400, // 24 hours
      });

      const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-in#/?__clerk_ticket=${signInToken.token}`;

      try {
        await resend.emails.send({
          from: 'ClientFlow <onboarding@resend.dev>',
          to: customerEmail,
          subject: 'Welcome to ClientFlow - Sign in with your magic link',
          react: MagicLinkEmail({ magicLink, planType }),
        });

        console.log(`✅ Magic link email sent to ${customerEmail}`);
      } catch (emailError) {
        console.error(`❌ Failed to send magic link email to ${customerEmail}:`, emailError);
        console.log(`Fallback Magic Link: ${magicLink}`);
      }
    } else {
      console.log(`User ${customerEmail} already signed up with Clerk - no magic link needed`);
    }
  } catch (error) {
    console.error("Error in checkout completion:", error);
  }
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

  // Only update planType if there's a pendingDowngradeTo in metadata
  // This handles scheduled downgrades when billing period ends
  // For immediate upgrades, the change-plan API handles the database update
  const updateData = {
    subscriptionStatus: status,
  };

  // If there's no pending downgrade metadata, keep current planType
  if (subscription.metadata.pendingDowngradeTo) {
    // Check if we're at the billing period end (when downgrade should take effect)
    const now = Math.floor(Date.now() / 1000);
    const periodEnd = subscription.current_period_end;

    // If we're within 1 hour of period end, apply the downgrade
    if (periodEnd - now < 3600) {
      updateData.planType = subscription.metadata.pendingDowngradeTo;
      console.log(`Applying scheduled downgrade for tenant: ${tenant.id} to ${subscription.metadata.pendingDowngradeTo}`);
    }
  } else if (subscription.metadata.planType && subscription.metadata.planType !== tenant.planType) {
    // Only update if metadata explicitly has a different planType
    // This catches edge cases but doesn't interfere with immediate upgrades
    updateData.planType = subscription.metadata.planType;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
  });

  console.log(`Subscription updated for tenant: ${tenant.id}, Status: ${status}${updateData.planType ? `, Plan: ${updateData.planType}` : ''}`);
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
