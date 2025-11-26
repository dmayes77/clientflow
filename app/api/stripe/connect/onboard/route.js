import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    let accountId = tenant.stripeAccountId;

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        email: tenant.email,
        metadata: {
          tenantId: tenant.id,
          clerkOrgId: orgId,
        },
      });

      accountId = account.id;

      // Update tenant with Stripe account ID
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          stripeAccountId: accountId,
          stripeAccountStatus: "pending",
        },
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/settings?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments/settings?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    });
  } catch (error) {
    console.error("Error creating Stripe onboarding link:", error);

    // Check if it's a Stripe Connect not enabled error
    if (error.message?.includes("signed up for Connect")) {
      return NextResponse.json(
        {
          error: "Stripe Connect is not enabled for this account. Please visit https://dashboard.stripe.com/settings/applications to enable Connect.",
          details: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create onboarding link", details: error.message },
      { status: 500 }
    );
  }
}
