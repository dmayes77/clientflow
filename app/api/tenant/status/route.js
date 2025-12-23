import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/tenant/status - Get tenant subscription status
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        id: true,
        subscriptionStatus: true,
        planType: true,
        accountType: true,
        stripeCustomerId: true,
        setupComplete: true,
        currentPeriodEnd: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({
        subscriptionStatus: null,
        planType: null,
        accountType: "standard",
        setupComplete: false,
      });
    }

    // Demo accounts always have "active" status and full access
    const isDemo = tenant.accountType === "demo";
    const effectiveStatus = isDemo ? "active" : tenant.subscriptionStatus;

    return NextResponse.json({
      subscriptionStatus: effectiveStatus,
      planType: tenant.planType,
      accountType: tenant.accountType || "standard",
      isDemo,
      setupComplete: tenant.setupComplete,
      hasSubscription: isDemo || !!tenant.stripeCustomerId,
      currentPeriodEnd: tenant.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Error fetching tenant status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
