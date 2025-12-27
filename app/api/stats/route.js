import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

// GET /api/stats - Get dashboard statistics
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Get counts in parallel
    const [
      totalBookings,
      totalContacts,
      totalServices,
      thisMonthBookings,
      lastMonthBookings,
      thisMonthPayments,
      lastMonthPayments,
    ] = await Promise.all([
      prisma.booking.count({
        where: { tenantId: tenant.id },
      }),
      prisma.contact.count({
        where: { tenantId: tenant.id },
      }),
      prisma.service.count({
        where: { tenantId: tenant.id, active: true },
      }),
      prisma.booking.findMany({
        where: {
          tenantId: tenant.id,
          scheduledAt: {
            gte: thisMonthStart,
            lte: thisMonthEnd,
          },
        },
        select: { totalPrice: true, status: true },
      }),
      prisma.booking.findMany({
        where: {
          tenantId: tenant.id,
          scheduledAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        select: { totalPrice: true, status: true },
      }),
      // Calculate revenue from actual payments (more accurate)
      prisma.payment.findMany({
        where: {
          tenantId: tenant.id,
          status: "succeeded",
          createdAt: {
            gte: thisMonthStart,
            lte: thisMonthEnd,
          },
        },
        select: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          tenantId: tenant.id,
          status: "succeeded",
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        select: { amount: true },
      }),
    ]);

    // Calculate revenue from actual payments (in cents)
    const thisMonthRevenue = thisMonthPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const lastMonthRevenue = lastMonthPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const totalRevenue = thisMonthRevenue; // Could also calculate all-time

    return NextResponse.json({
      totalBookings,
      totalContacts,
      totalServices,
      totalRevenue,
      thisMonthBookings: thisMonthBookings.length,
      thisMonthRevenue,
      lastMonthBookings: lastMonthBookings.length,
      lastMonthRevenue,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
