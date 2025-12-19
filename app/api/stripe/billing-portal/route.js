import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/billing-portal - Create a Stripe billing portal session
export async function POST() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { stripeCustomerId: true },
    });

    if (!tenant?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 400 }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
