import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request) {
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

    // If no Stripe account, return not connected status
    if (!tenant.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }

    // Fetch account details from Stripe
    const account = await stripe.accounts.retrieve(tenant.stripeAccountId);

    const onboardingComplete = account.details_submitted && account.charges_enabled;

    // Update tenant if onboarding status changed
    if (tenant.stripeOnboardingComplete !== onboardingComplete) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          stripeOnboardingComplete: onboardingComplete,
          stripeAccountStatus: account.charges_enabled ? "active" : "pending",
        },
      });
    }

    return NextResponse.json({
      connected: true,
      accountId: account.id,
      onboardingComplete: onboardingComplete,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      country: account.country,
      currency: account.default_currency,
    });
  } catch (error) {
    console.error("Error fetching Stripe account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account status" },
      { status: 500 }
    );
  }
}
