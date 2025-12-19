import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// POST /api/stripe/connect/disconnect - Disconnect Stripe account
export async function POST() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true, stripeAccountId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Clear Stripe account data
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        stripeAccountId: null,
        stripeAccountStatus: null,
        stripeOnboardingComplete: false,
        requirePayment: false, // Disable payment requirement when disconnecting
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
