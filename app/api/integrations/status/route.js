import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/integrations/status - Get connected integrations status
export async function GET() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        metadata: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const connected = [];

    // Check Stripe Connect status
    if (tenant.stripeAccountId && tenant.stripeOnboardingComplete) {
      connected.push("stripe-connect");
    }

    // Check Google Calendar (stored in metadata)
    const metadata = tenant.metadata || {};
    if (metadata.googleCalendarConnected) {
      connected.push("google-calendar");
    }

    return NextResponse.json({ connected });
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
