import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { resend } from "@/lib/resend";
import { MagicLinkEmail } from "@/emails/tenant/magic-link";

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== "subscription") {
      return NextResponse.json(
        { error: "Not a subscription session" },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const customerId = session.customer;
    const customerEmail = session.customer_details?.email || session.customer_email;

    if (!customerEmail) {
      return NextResponse.json(
        { error: "No customer email found" },
        { status: 400 }
      );
    }

    // Check if tenant already exists
    let tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (tenant) {
      return NextResponse.json({
        message: "Account already exists",
        tenantId: tenant.id,
        email: customerEmail,
      });
    }

    // Create Clerk user and organization
    const client = await clerkClient();

    // Create Clerk user
    // Extract name from email if available
    const nameFromEmail = customerEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim();

    const clerkUser = await client.users.createUser({
      emailAddress: [customerEmail],
      skipPasswordRequirement: true,
      firstName: nameFromEmail || "User",
      lastName: "",
    });

    // Create Clerk organization
    const clerkOrg = await client.organizations.createOrganization({
      name: `${customerEmail.split('@')[0]}'s Organization`,
      createdBy: clerkUser.id,
    });

    // Determine status and plan type
    const status = subscription.status === "trialing" ? "trialing" : subscription.status;
    const planType = subscription.metadata.planType || "professional";

    // Create tenant
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

    // Create sign-in token for magic link
    const signInToken = await client.signInTokens.createSignInToken({
      userId: clerkUser.id,
      expiresInSeconds: 86400, // 24 hours
    });

    // Generate magic link
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-in#/?__clerk_ticket=${signInToken.token}`;

    // Send magic link email via Resend
    try {
      await resend.emails.send({
        from: 'ClientFlow <onboarding@resend.dev>', // Use your verified domain in production
        to: customerEmail,
        subject: 'Welcome to ClientFlow - Sign in with your magic link',
        react: MagicLinkEmail({ magicLink, planType }),
      });

      console.log(`✅ Magic link email sent to ${customerEmail}`);
    } catch (emailError) {
      console.error(`❌ Failed to send magic link email to ${customerEmail}:`, emailError);
      // Continue anyway - magic link is returned in response for testing
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      tenantId: tenant.id,
      email: customerEmail,
      clerkUserId: clerkUser.id,
      clerkOrgId: clerkOrg.id,
      magicLink: magicLink, // For testing
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      {
        error: error.message,
        details: error.errors || error.details || "No additional details",
        clerkError: error.clerkError || false
      },
      { status: 500 }
    );
  }
}
