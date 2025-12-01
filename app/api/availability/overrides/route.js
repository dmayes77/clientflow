import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/availability/overrides - List all date overrides
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const overrides = await prisma.availabilityOverride.findMany({
      where: { tenantId: tenant.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(overrides);
  } catch (error) {
    console.error("Error fetching availability overrides:", error);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }
}

// POST /api/availability/overrides - Create a new date override
export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { date, type, startTime, endTime, reason } = body;

    if (!date || !type) {
      return NextResponse.json(
        { error: "Date and type are required" },
        { status: 400 }
      );
    }

    if (!["closed", "custom"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'closed' or 'custom'" },
        { status: 400 }
      );
    }

    if (type === "custom" && (!startTime || !endTime)) {
      return NextResponse.json(
        { error: "Start time and end time are required for custom hours" },
        { status: 400 }
      );
    }

    // Parse the date to ensure it's stored as date-only
    const dateOnly = new Date(date);
    dateOnly.setUTCHours(0, 0, 0, 0);

    // Check if an override already exists for this date
    const existing = await prisma.availabilityOverride.findUnique({
      where: {
        tenantId_date: {
          tenantId: tenant.id,
          date: dateOnly,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An override already exists for this date" },
        { status: 409 }
      );
    }

    const override = await prisma.availabilityOverride.create({
      data: {
        tenantId: tenant.id,
        date: dateOnly,
        type,
        startTime: type === "custom" ? startTime : null,
        endTime: type === "custom" ? endTime : null,
        reason: reason || null,
      },
    });

    return NextResponse.json(override, { status: 201 });
  } catch (error) {
    console.error("Error creating availability override:", error);
    return NextResponse.json({ error: "Failed to create override" }, { status: 500 });
  }
}
