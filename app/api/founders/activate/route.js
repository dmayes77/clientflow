import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Valid founder codes (in production, these would be stored in a database)
const VALID_FOUNDER_CODES = [
  "FOUNDER2024",
  "EARLYADOPTER",
  "BETAUSER",
  "LAUNCH2024",
];

// POST /api/founders/activate - Activate founder access
export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Founder code is required" }, { status: 400 });
    }

    // Validate founder code
    const normalizedCode = code.toUpperCase().trim();
    if (!VALID_FOUNDER_CODES.includes(normalizedCode)) {
      return NextResponse.json({ error: "Invalid founder code" }, { status: 400 });
    }

    // Get or create tenant
    let tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          clerkOrgId: orgId,
          name: "My Business",
          email: "",
        },
      });
    }

    // Check if already activated
    if (tenant.subscriptionStatus === "active" && tenant.planType === "founders") {
      return NextResponse.json({ error: "Founders access already activated" }, { status: 400 });
    }

    // Calculate expiration (1 year from now)
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);

    // Activate founder access
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionStatus: "active",
        planType: "founders",
        currentPeriodEnd,
        metadata: {
          founderCode: normalizedCode,
          founderActivatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Founders access activated for 1 year",
      expiresAt: currentPeriodEnd.toISOString(),
    });
  } catch (error) {
    console.error("Error activating founder access:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
