import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/tenant/payment-settings - Get tenant payment settings
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        requirePayment: true,
        paymentType: true,
        depositType: true,
        depositValue: true,
        payInFullDiscount: true,
        balanceDueAt: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/tenant/payment-settings - Update tenant payment settings
export async function PATCH(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      requirePayment,
      paymentType,
      depositType,
      depositValue,
      payInFullDiscount,
      balanceDueAt,
    } = body;

    // Validate payInFullDiscount is between 0 and 15
    if (payInFullDiscount !== undefined && (payInFullDiscount < 0 || payInFullDiscount > 15)) {
      return NextResponse.json(
        { error: "Pay-in-full discount must be between 0 and 15%" },
        { status: 400 }
      );
    }

    // Validate depositValue
    if (depositValue !== undefined && depositValue < 0) {
      return NextResponse.json(
        { error: "Deposit value must be positive" },
        { status: 400 }
      );
    }

    // If deposit type is percentage, validate 1-99
    if (depositType === "percentage" && depositValue !== undefined) {
      if (depositValue < 1 || depositValue > 99) {
        return NextResponse.json(
          { error: "Deposit percentage must be between 1 and 99" },
          { status: 400 }
        );
      }
    }

    const tenant = await prisma.tenant.update({
      where: { clerkOrgId: orgId },
      data: {
        ...(requirePayment !== undefined && { requirePayment }),
        ...(paymentType !== undefined && { paymentType }),
        ...(depositType !== undefined && { depositType }),
        ...(depositValue !== undefined && { depositValue }),
        ...(payInFullDiscount !== undefined && { payInFullDiscount }),
        ...(balanceDueAt !== undefined && { balanceDueAt }),
      },
      select: {
        requirePayment: true,
        paymentType: true,
        depositType: true,
        depositValue: true,
        payInFullDiscount: true,
        balanceDueAt: true,
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
