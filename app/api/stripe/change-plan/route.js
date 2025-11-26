import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { newPriceId, newPlanType } = await request.json();

    if (!newPriceId || !newPlanType) {
      return NextResponse.json(
        { error: "Price ID and plan type are required" },
        { status: 400 }
      );
    }

    // Get tenant by Clerk organization ID
    const tenant = await prisma.tenant.findFirst({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    if (!tenant.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Get the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: tenant.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    console.log(`🔍 DEBUG: Found ${subscriptions.data.length} active subscriptions for customer ${tenant.stripeCustomerId}`);

    if (subscriptions.data.length === 0) {
      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: tenant.stripeCustomerId,
        status: "trialing",
        limit: 1,
      });

      if (trialingSubscriptions.data.length === 0) {
        return NextResponse.json(
          { error: "No active subscription found" },
          { status: 404 }
        );
      }

      console.log(`🔍 DEBUG: Found trialing subscription, updating directly without price check`);

      // Update trialing subscription
      const subscription = trialingSubscriptions.data[0];
      await stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        metadata: {
          planType: newPlanType,
        },
        proration_behavior: "always_invoice",
      });

      // Update tenant in database immediately
      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planType: newPlanType },
      });

      console.log(`✅ TRIALING UPGRADE: Updated tenant ${tenant.id} planType to ${newPlanType}, DB shows: ${updatedTenant.planType}`);

      return NextResponse.json({
        success: true,
        message: "Plan updated successfully! You now have immediate access to the new plan.",
      });
    }

    // Determine if this is an upgrade or downgrade
    const subscription = subscriptions.data[0];
    const currentPrice = subscription.items.data[0].price.unit_amount;

    // Get the new price amount
    const newPrice = await stripe.prices.retrieve(newPriceId);
    const newPriceAmount = newPrice.unit_amount;

    const isUpgrade = newPriceAmount > currentPrice;

    console.log(`🔍 DEBUG PRICE COMPARISON:`);
    console.log(`   Current Price: ${currentPrice} (${currentPrice / 100} ${subscription.items.data[0].price.currency})`);
    console.log(`   New Price: ${newPriceAmount} (${newPriceAmount / 100} ${newPrice.currency})`);
    console.log(`   Is Upgrade: ${isUpgrade}`);

    if (isUpgrade) {
      // UPGRADE: Apply immediately with proration
      await stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        metadata: {
          planType: newPlanType,
        },
        proration_behavior: "always_invoice", // Charge the prorated difference immediately
      });

      // Update tenant immediately
      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planType: newPlanType },
      });

      console.log(`✅ UPGRADE: Updated tenant ${tenant.id} planType to ${newPlanType}, DB shows: ${updatedTenant.planType}`);

      return NextResponse.json({
        success: true,
        message: "Upgraded successfully! You now have immediate access to the new plan.",
        isUpgrade: true,
      });
    } else {
      console.log(`⬇️ DOWNGRADE PATH: Scheduling for end of billing period`);

      // DOWNGRADE: Schedule for end of billing period
      await stripe.subscriptions.update(subscription.id, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        metadata: {
          planType: newPlanType,
          pendingDowngradeTo: newPlanType,
        },
        proration_behavior: "none", // No proration for downgrades
        billing_cycle_anchor: "unchanged", // Keep current billing cycle
      });

      return NextResponse.json({
        success: true,
        message: "Downgrade scheduled. You'll keep your current plan until the end of your billing period.",
        isUpgrade: false,
        effectiveDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
      });
    }
  } catch (error) {
    console.error("Error changing plan:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
