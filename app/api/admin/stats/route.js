import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// GET /api/admin/stats - Get platform statistics
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Run all queries in parallel
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      tenantsThisMonth,
      tenantsLastMonth,
      totalBookings,
      bookingsThisMonth,
      totalContacts,
      totalPayments,
      revenueThisMonth,
      subscriptionStats,
    ] = await Promise.all([
      // Total tenants
      prisma.tenant.count(),

      // Active tenants (with active subscription)
      prisma.tenant.count({
        where: {
          subscriptionStatus: "active",
        },
      }),

      // Trial tenants
      prisma.tenant.count({
        where: {
          subscriptionStatus: "trialing",
        },
      }),

      // Tenants created this month
      prisma.tenant.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),

      // Tenants created last month
      prisma.tenant.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Total bookings across all tenants
      prisma.booking.count(),

      // Bookings this month
      prisma.booking.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),

      // Total contacts across all tenants
      prisma.contact.count(),

      // Total payments (from platform subscriptions, not tenant payments)
      prisma.payment.count(),

      // Revenue this month (sum of subscription payments)
      // Note: This would need adjustment based on your payment tracking
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: { gte: startOfMonth },
          status: "succeeded",
        },
      }),

      // Subscription breakdown
      prisma.tenant.groupBy({
        by: ["subscriptionStatus"],
        _count: true,
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    // Assuming $149/month for active subscribers
    const mrr = activeTenants * 14900; // in cents

    // Calculate growth
    const tenantGrowth = tenantsLastMonth > 0
      ? ((tenantsThisMonth - tenantsLastMonth) / tenantsLastMonth) * 100
      : tenantsThisMonth > 0 ? 100 : 0;

    return NextResponse.json({
      tenants: {
        total: totalTenants,
        active: activeTenants,
        trial: trialTenants,
        thisMonth: tenantsThisMonth,
        growth: Math.round(tenantGrowth * 10) / 10,
      },
      bookings: {
        total: totalBookings,
        thisMonth: bookingsThisMonth,
      },
      contacts: {
        total: totalContacts,
      },
      revenue: {
        mrr,
        thisMonth: revenueThisMonth._sum.amount || 0,
      },
      subscriptions: subscriptionStats.reduce((acc, item) => {
        acc[item.subscriptionStatus || "none"] = item._count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
