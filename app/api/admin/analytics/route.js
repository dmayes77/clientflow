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
    const period = searchParams.get("period") || "30"; // days

    const now = new Date();
    const periodDays = parseInt(period);
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get monthly data for last 12 months
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      months.push({ start: monthStart, end: monthEnd });
    }

    // Fetch all data in parallel
    const [
      // Tenant counts over time
      tenantsByMonth,
      // Current active subscription breakdown
      activeByPlan,
      // Total bookings
      totalBookings,
      // Bookings by month
      bookingsByMonth,
      // Total payments/revenue
      paymentStats,
      // Top tenants by usage
      topTenantsByBookings,
      topTenantsByContacts,
      // Recent signups
      recentSignups,
      // Subscription status changes
      statusCounts,
    ] = await Promise.all([
      // Tenants created per month
      Promise.all(months.map(async (m) => {
        const count = await prisma.tenant.count({
          where: {
            createdAt: { gte: m.start, lte: m.end },
          },
        });
        return {
          month: m.start.toISOString(),
          label: m.start.toLocaleDateString("en-US", { month: "short" }),
          count,
        };
      })),
      // Active subscriptions by plan
      prisma.tenant.groupBy({
        by: ["planType"],
        where: { subscriptionStatus: "active" },
        _count: true,
      }),
      // Total bookings
      prisma.booking.count(),
      // Bookings per month
      Promise.all(months.map(async (m) => {
        const count = await prisma.booking.count({
          where: {
            createdAt: { gte: m.start, lte: m.end },
          },
        });
        return {
          month: m.start.toISOString(),
          label: m.start.toLocaleDateString("en-US", { month: "short" }),
          count,
        };
      })),
      // Payment stats
      prisma.payment.aggregate({
        where: { status: "succeeded" },
        _sum: { amount: true },
        _count: true,
      }),
      // Top tenants by bookings
      prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          businessName: true,
          subscriptionStatus: true,
          _count: { select: { bookings: true } },
        },
        orderBy: { bookings: { _count: "desc" } },
        take: 10,
      }),
      // Top tenants by contacts
      prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          businessName: true,
          subscriptionStatus: true,
          _count: { select: { contacts: true } },
        },
        orderBy: { contacts: { _count: "desc" } },
        take: 10,
      }),
      // Recent signups (last 7 days)
      prisma.tenant.findMany({
        where: {
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          businessName: true,
          email: true,
          subscriptionStatus: true,
          createdAt: true,
        },
      }),
      // Status counts
      prisma.tenant.groupBy({
        by: ["subscriptionStatus"],
        _count: true,
      }),
    ]);

    // Get dynamic plan pricing from database
    const planPricing = await getPlanPricing();

    // Calculate MRR (Monthly Recurring Revenue) - Platform subscription revenue
    const planBreakdown = {};
    activeByPlan.forEach(p => {
      planBreakdown[p.planType || "platform"] = p._count;
    });

    let currentMrr = 0;
    Object.entries(planBreakdown).forEach(([plan, count]) => {
      currentMrr += (planPricing[plan] || planPricing.platform || 2900) * count;
    });

    // Calculate ARR (Annual Recurring Revenue)
    const currentArr = currentMrr * 12;

    // Calculate growth metrics
    const totalTenants = statusCounts.reduce((sum, s) => sum + s._count, 0);
    const activeTenants = statusCounts.find(s => s.subscriptionStatus === "active")?._count || 0;
    const trialTenants = statusCounts.find(s => s.subscriptionStatus === "trialing")?._count || 0;

    // Calculate conversion rate (trials -> active)
    const canceledCount = statusCounts.find(s => s.subscriptionStatus === "canceled")?._count || 0;
    const conversionRate = (trialTenants + activeTenants + canceledCount) > 0
      ? Math.round((activeTenants / (trialTenants + activeTenants + canceledCount)) * 100)
      : 0;

    // Platform usage
    const avgBookingsPerTenant = totalTenants > 0
      ? Math.round(totalBookings / totalTenants)
      : 0;

    // Transform status counts
    const statusBreakdown = {};
    statusCounts.forEach(s => {
      statusBreakdown[s.subscriptionStatus || "none"] = s._count;
    });

    return NextResponse.json({
      overview: {
        totalTenants,
        activeTenants,
        trialTenants,
        // Platform Revenue (what ClientFlow collects from subscriptions)
        currentMrr,
        currentArr,
        // Platform Usage Stats
        totalBookings,
        avgBookingsPerTenant,
        conversionRate,
        // Tenant GMV (what tenants collect from their customers - for reference only)
        tenantGmv: paymentStats._sum.amount || 0,
        tenantPaymentCount: paymentStats._count || 0,
      },
      charts: {
        tenantGrowth: tenantsByMonth,
        bookingVolume: bookingsByMonth,
      },
      planBreakdown,
      statusBreakdown,
      topTenants: {
        byBookings: topTenantsByBookings,
        byContacts: topTenantsByContacts,
      },
      recentSignups,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
