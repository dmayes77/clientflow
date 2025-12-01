import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";

export async function GET(request) {
  // Apply rate limiting: 100 requests per minute
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({
        totalBookings: 0,
        totalClients: 0,
        totalServices: 0,
        totalRevenue: 0,
        thisMonthBookings: 0,
        thisMonthRevenue: 0,
      });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [
      totalBookings,
      totalClients,
      totalServices,
      thisMonthBookings,
      allBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: { tenantId: tenant.id },
      }),
      prisma.client.count({
        where: { tenantId: tenant.id },
      }),
      prisma.service.count({
        where: { tenantId: tenant.id },
      }),
      prisma.booking.count({
        where: {
          tenantId: tenant.id,
          scheduledAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          tenantId: tenant.id,
          totalPrice: { not: null },
        },
        select: { totalPrice: true, scheduledAt: true },
      }),
    ]);

    const totalRevenue = allBookings.reduce(
      (sum, booking) => sum + (booking.totalPrice || 0),
      0
    );

    const thisMonthRevenue = allBookings
      .filter(
        (booking) =>
          booking.scheduledAt >= firstDayOfMonth && booking.scheduledAt <= lastDayOfMonth
      )
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    return NextResponse.json({
      totalBookings,
      totalClients,
      totalServices,
      totalRevenue,
      thisMonthBookings,
      thisMonthRevenue,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
