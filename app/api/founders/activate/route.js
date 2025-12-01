import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Valid founder codes - can also be stored in env vars for more security
const VALID_CODES = ["FOUNDER2024", "CLIENTFLOW50"];

export async function POST(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { founderCode } = body;

    // Validate the founder code
    if (!founderCode || !VALID_CODES.includes(founderCode.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid founder code" },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found. Please complete organization setup first." },
        { status: 404 }
      );
    }

    // Check if already a founder (prevent re-activation)
    if (tenant.planType === "founders") {
      return NextResponse.json({
        success: true,
        message: "Already a founding member",
        alreadyActivated: true,
      });
    }

    // Calculate end date (365 days from now)
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Activate founders subscription
    const updatedTenant = await prisma.tenant.update({
      where: { clerkOrgId: orgId },
      data: {
        subscriptionStatus: "active",
        planType: "founders",
        stripeSubscriptionId: `founders_${Date.now()}`, // Unique identifier
        currentPeriodEnd: endDate,
        metadata: {
          ...(tenant.metadata || {}),
          founderCode: founderCode.toUpperCase(),
          founderActivatedAt: new Date().toISOString(),
          founderEndDate: endDate.toISOString(),
          founderDiscount: 50, // 50% off after first year
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Founders program activated successfully",
      endDate: endDate.toISOString(),
      planType: "founders",
    });
  } catch (error) {
    console.error("Error activating founders program:", error);
    return NextResponse.json(
      { error: "Failed to activate founders program" },
      { status: 500 }
    );
  }
}
