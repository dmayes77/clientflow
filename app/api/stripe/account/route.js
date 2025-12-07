import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// GET /api/stripe/account - Get Stripe Connect account status
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // If no Stripe account connected yet
    if (!tenant.stripeAccountId) {
      return NextResponse.json({
        connected: false,
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        onboardingComplete: false,
      });
    }

    // Fetch account details from Stripe
    try {
      const account = await stripe.accounts.retrieve(tenant.stripeAccountId);

      // Update tenant with latest status
      await prisma.tenant.update({
        where: { clerkOrgId: orgId },
        data: {
          stripeAccountStatus: account.charges_enabled ? "active" : "pending",
          stripeOnboardingComplete: account.details_submitted,
        },
      });

      return NextResponse.json({
        connected: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingComplete: account.details_submitted,
        country: account.country,
        defaultCurrency: account.default_currency?.toUpperCase(),
        businessType: account.business_type,
        email: account.email,
      });
    } catch (stripeError) {
      console.error("Stripe account retrieval error:", stripeError);
      return NextResponse.json({
        connected: false,
        error: "Failed to retrieve Stripe account",
      });
    }
  } catch (error) {
    console.error("Error fetching Stripe account:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
