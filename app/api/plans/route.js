import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/plans - Get active plans (public endpoint for pricing pages)
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        features: true,
        priceMonthly: true,
        priceYearly: true,
        stripePriceId: true,
        stripePriceIdYearly: true,
        maxContacts: true,
        maxBookings: true,
        maxServices: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
