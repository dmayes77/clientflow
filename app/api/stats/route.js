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
      totalClients,
      totalServices,
      thisMonthBookings,
      lastMonthBookings,
      completedBookings,
      completedBookingsLastMonth,
    ] = await Promise.all([
      prisma.booking.count({
        where: { tenantId: tenant.id },
      }),
      prisma.client.count({
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
      prisma.booking.findMany({
        where: {
          tenantId: tenant.id,
          status: "completed",
          scheduledAt: {
            gte: thisMonthStart,
            lte: thisMonthEnd,
          },
        },
        select: { totalPrice: true },
      }),
      prisma.booking.findMany({
        where: {
          tenantId: tenant.id,
          status: "completed",
          scheduledAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        select: { totalPrice: true },
      }),
    ]);

    // Calculate revenue
    const thisMonthRevenue = completedBookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );
    const lastMonthRevenue = completedBookingsLastMonth.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );
    const totalRevenue = thisMonthRevenue; // Could also calculate all-time

    return NextResponse.json({
      totalBookings,
      totalClients,
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
