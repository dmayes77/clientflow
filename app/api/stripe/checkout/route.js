import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/checkout - Create a Stripe checkout session
export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
    }

    // Get or create tenant
    let tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      // Fetch org and user details from Clerk
      const client = await clerkClient();
      const [org, user] = await Promise.all([
        client.organizations.getOrganization({ organizationId: orgId }),
        client.users.getUser(userId),
      ]);

      // Get primary email from user
      const userEmail = user.emailAddresses.find(
        (e) => e.id === user.primaryEmailAddressId
      )?.emailAddress || "";

      // Create tenant with org details and user email
      tenant = await prisma.tenant.create({
        data: {
          clerkOrgId: orgId,
          name: org.name || "My Business",
          businessName: org.name || "My Business",
          slug: org.slug || null,
          email: userEmail,
        },
      });
    } else if (!tenant.slug || !tenant.businessName || !tenant.email) {
      // Tenant exists but missing data - try to sync from Clerk
      const client = await clerkClient();
      const [org, user] = await Promise.all([
        client.organizations.getOrganization({ organizationId: orgId }),
        client.users.getUser(userId),
      ]);

      const updateData = {};
      if (!tenant.slug && org.slug) {
        updateData.slug = org.slug;
      }
      if (!tenant.businessName && org.name) {
        updateData.businessName = org.name;
      }
      if (!tenant.email) {
        const userEmail = user.emailAddresses.find(
          (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress;
        if (userEmail) {
          updateData.email = userEmail;
        }
      }

      if (Object.keys(updateData).length > 0) {
        tenant = await prisma.tenant.update({
          where: { id: tenant.id },
          data: updateData,
        });
      }
    }

    // Get or create Stripe customer
    let customerId = tenant.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: tenant.email || undefined,
        name: tenant.businessName || tenant.name,
        metadata: {
          tenantId: tenant.id,
          clerkOrgId: orgId,
        },
      });

      customerId = customer.id;

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Look up the plan from database to get plan slug for metadata
    const plan = await prisma.plan.findFirst({
      where: {
        OR: [
          { stripePriceId: priceId },
          { stripePriceIdYearly: priceId },
        ],
      },
    });

    // Get trial days from platform settings
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
    });
    const trialDays = settings?.trialDays ?? 30;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          tenantId: tenant.id,
          planSlug: plan?.slug || null,
        },
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/payment`,
      metadata: {
        tenantId: tenant.id,
        planSlug: plan?.slug || null,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
