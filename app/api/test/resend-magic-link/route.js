import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { MagicLinkEmail } from "@/emails/tenant/magic-link";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find tenant by email
    const tenant = await prisma.tenant.findFirst({
      where: { email },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "No account found with that email" },
        { status: 404 }
      );
    }

    // Find Clerk user by organization ID
    const client = await clerkClient();
    const orgMemberships = await client.organizations.getOrganizationMembershipList({
      organizationId: tenant.clerkOrgId,
    });

    if (orgMemberships.data.length === 0) {
      return NextResponse.json(
        { error: "No user found for this organization" },
        { status: 404 }
      );
    }

    const userId = orgMemberships.data[0].publicUserData.userId;

    // Generate new magic link
    const signInToken = await client.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 86400, // 24 hours
    });

    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-in#/?__clerk_ticket=${signInToken.token}`;

    // Send email
    const emailResult = await resend.emails.send({
      from: "ClientFlow <onboarding@resend.dev>",
      to: email,
      subject: "Your ClientFlow Magic Link",
      react: MagicLinkEmail({
        magicLink,
        planType: tenant.planType
      }),
    });

    console.log("✅ Magic link email sent to", email);
    console.log("📧 Resend Email ID:", emailResult.id);

    return NextResponse.json({
      success: true,
      message: "Magic link sent! Check your email (and spam folder).",
      emailId: emailResult.id,
      email,
    });
  } catch (error) {
    console.error("Error sending magic link:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
