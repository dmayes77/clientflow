import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get tenant by Clerk organization ID
    const tenant = await prisma.tenant.findFirst({
      where: { clerkOrgId: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        planType: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Fetch subscription details from Stripe if customer exists
    let subscriptionData = null;
    if (tenant.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: tenant.stripeCustomerId,
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          subscriptionData = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            metadata: subscription.metadata,
          };
        }
      } catch (stripeError) {
        console.error("Error fetching subscription from Stripe:", stripeError);
        // Continue without subscription data
      }
    }

    return NextResponse.json({
      ...tenant,
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
