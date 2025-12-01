import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Valid IANA timezone list (common US timezones)
const VALID_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const VALID_SLOT_INTERVALS = [30, 60, 120, 180, 240];

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { clerkOrgId: orgId },
      select: {
        timezone: true,
        slotInterval: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching scheduling settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { timezone, slotInterval } = body;

    // Validate timezone if provided
    if (timezone && !VALID_TIMEZONES.includes(timezone)) {
      return NextResponse.json(
        { error: "Invalid timezone" },
        { status: 400 }
      );
    }

    // Validate slot interval if provided
    if (slotInterval && !VALID_SLOT_INTERVALS.includes(slotInterval)) {
      return NextResponse.json(
        { error: "Invalid slot interval. Must be 30, 60, 120, 180, or 240 minutes" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (timezone) updateData.timezone = timezone;
    if (slotInterval) updateData.slotInterval = slotInterval;

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
      select: {
        timezone: true,
        slotInterval: true,
      },
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating scheduling settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
