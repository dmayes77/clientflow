import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plans/debug - Debug endpoint to see all plans (including inactive)
export async function GET() {
  try {
    const allPlans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
    });

    const activePlans = allPlans.filter(p => p.active);
    const inactivePlans = allPlans.filter(p => !p.active);

    return NextResponse.json({
      total: allPlans.length,
      active: activePlans.length,
      inactive: inactivePlans.length,
      plans: allPlans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        active: p.active,
        priceMonthly: p.priceMonthly,
        stripePriceId: p.stripePriceId,
        isDefault: p.isDefault,
      })),
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
