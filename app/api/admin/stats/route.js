import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List of admin user IDs (you should move this to env or database)
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!ADMIN_USER_IDS.includes(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalTenants,
      activeTenants,
      trialingTenants,
      canceledTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({
        where: { subscriptionStatus: "active" },
      }),
      prisma.tenant.count({
        where: { subscriptionStatus: "trialing" },
      }),
      prisma.tenant.count({
        where: { subscriptionStatus: "canceled" },
      }),
    ]);

    // Calculate MRR (assuming $149/month per active subscription)
    const monthlyPrice = 14900; // cents
    const monthlyRecurringRevenue = activeTenants * monthlyPrice;

    return NextResponse.json({
      totalTenants,
      activeTenants,
      trialingTenants,
      canceledTenants,
      monthlyRecurringRevenue,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
