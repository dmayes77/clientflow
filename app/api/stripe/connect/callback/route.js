import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// GET /api/stripe/connect/callback - Handle Stripe OAuth callback
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is the tenant ID
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
    const redirectBase = `${origin}/dashboard/integrations/stripe`;

    // Handle OAuth errors
    if (error) {
      console.error("Stripe OAuth error:", error, errorDescription);
      return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${redirectBase}?error=Missing authorization code`);
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: state },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.redirect(`${redirectBase}?error=Invalid state parameter`);
    }

    // Exchange authorization code for access token
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const stripeAccountId = response.stripe_user_id;

    if (!stripeAccountId) {
      return NextResponse.redirect(`${redirectBase}?error=Failed to get Stripe account ID`);
    }

    // Get account details to verify it's set up correctly
    const account = await stripe.accounts.retrieve(stripeAccountId);

    // Update tenant with connected Stripe account
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeAccountId: stripeAccountId,
        stripeAccountStatus: account.charges_enabled ? "active" : "pending",
        stripeOnboardingComplete: account.charges_enabled && account.payouts_enabled,
      },
    });

    return NextResponse.redirect(`${redirectBase}?success=true`);
  } catch (error) {
    console.error("Error handling Stripe OAuth callback:", error);
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${origin}/dashboard/integrations/stripe?error=${encodeURIComponent(error.message)}`
    );
  }
}
