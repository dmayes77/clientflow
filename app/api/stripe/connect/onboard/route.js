import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/connect/onboard - Create or continue Stripe Connect onboarding
export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeAccountId: true,
        businessName: true,
        businessWebsite: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    let accountId = tenant.stripeAccountId;

    // Create a new Connect account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: tenant.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: tenant.businessName || tenant.name,
          url: tenant.businessWebsite || undefined,
        },
        metadata: {
          tenantId: tenant.id,
        },
      });

      accountId = account.id;

      // Save the account ID to the tenant
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          stripeAccountId: accountId,
          stripeAccountStatus: "pending",
        },
      });
    }

    // Get the base URL for redirects
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/integrations?refresh=true`,
      return_url: `${origin}/dashboard/integrations?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Error creating Stripe onboarding:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
