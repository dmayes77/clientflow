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

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        businessName: true,
        subscriptionStatus: true,
        planType: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        setupComplete: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clients: true,
            bookings: true,
            services: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tenants });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
