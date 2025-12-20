import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];

async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
}

// Get plan pricing from database
async function getPlanPricing() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    select: { slug: true, priceMonthly: true },
  });

  const pricing = {};
  plans.forEach(plan => {
    pricing[plan.slug] = plan.priceMonthly;
  });

  // Fallback defaults if no plans in DB
  if (Object.keys(pricing).length === 0) {
    pricing.platform = 2900;
    pricing.professional = 7900;
  }

  return pricing;
}

export async function GET(request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const risk = searchParams.get("risk"); // "at_risk" for past_due + expiring trials

    // Get date ranges
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Build where clause
    let where = {};
    if (status && status !== "all") {
      where.subscriptionStatus = status;
    }
    if (risk === "at_risk") {
      where.OR = [
        { subscriptionStatus: "past_due" },
        {
          subscriptionStatus: "trialing",
          currentPeriodEnd: { lte: sevenDaysFromNow },
        },
      ];
    }

    // Fetch all stats in parallel
    const [
      tenants,
      statusCounts,
      planCounts,
      newThisMonth,
      canceledThisMonth,
      pastDueCount,
      expiringTrials,
    ] = await Promise.all([
      // Tenants with filters
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          businessName: true,
          email: true,
          subscriptionStatus: true,
          planType: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          currentPeriodEnd: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              contacts: true,
              payments: true,
            },
          },
        },
      }),
      // Status breakdown
      prisma.tenant.groupBy({
        by: ["subscriptionStatus"],
        _count: true,
      }),
      // Plan breakdown
      prisma.tenant.groupBy({
        by: ["planType"],
        where: { subscriptionStatus: "active" },
        _count: true,
      }),
      // New subscriptions this month
      prisma.tenant.count({
        where: {
          subscriptionStatus: "active",
          createdAt: { gte: thisMonthStart },
        },
      }),
      // Canceled this month
      prisma.tenant.count({
        where: {
          subscriptionStatus: "canceled",
          updatedAt: { gte: thisMonthStart },
        },
      }),
      // Past due count
      prisma.tenant.count({
        where: { subscriptionStatus: "past_due" },
      }),
      // Trials expiring in 7 days
      prisma.tenant.count({
        where: {
          subscriptionStatus: "trialing",
          currentPeriodEnd: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      }),
    ]);

    // Get dynamic plan pricing from database
    const planPricing = await getPlanPricing();

    // Calculate MRR (Monthly Recurring Revenue) - Platform subscription revenue
    const activeByPlan = {};
    planCounts.forEach(p => {
      activeByPlan[p.planType || "platform"] = p._count;
    });

    let mrr = 0;
    Object.entries(activeByPlan).forEach(([plan, count]) => {
      mrr += (planPricing[plan] || planPricing.platform || 2900) * count;
    });

    // Transform status counts to object
    const statusBreakdown = {};
    statusCounts.forEach(s => {
      statusBreakdown[s.subscriptionStatus || "none"] = s._count;
    });

    // Transform plan counts to object
    const planBreakdown = {};
    planCounts.forEach(p => {
      planBreakdown[p.planType || "basic"] = p._count;
    });

    // Calculate churn rate (simplified: canceled this month / active last month start)
    const activeLastMonth = (statusBreakdown.active || 0) + canceledThisMonth;
    const churnRate = activeLastMonth > 0
      ? Math.round((canceledThisMonth / activeLastMonth) * 100 * 10) / 10
      : 0;

    return NextResponse.json({
      tenants,
      stats: {
        mrr,
        activeCount: statusBreakdown.active || 0,
        trialCount: statusBreakdown.trialing || 0,
        pastDueCount,
        canceledCount: statusBreakdown.canceled || 0,
        expiringTrials,
        newThisMonth,
        canceledThisMonth,
        churnRate,
      },
      statusBreakdown,
      planBreakdown,
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
