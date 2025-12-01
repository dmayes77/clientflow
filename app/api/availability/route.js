import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Day names for reference
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// GET /api/availability - Get all availability slots
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

    const availability = await prisma.availability.findMany({
      where: { tenantId: tenant.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

// POST /api/availability - Create or update availability for a day
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
    const { dayOfWeek, startTime, endTime, active } = body;

    // Validate day of week
    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json({ error: "Invalid day of week (0-6)" }, { status: 400 });
    }

    // Validate times
    if (!startTime || !endTime) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }

    // Check if availability already exists for this day
    const existing = await prisma.availability.findFirst({
      where: {
        tenantId: tenant.id,
        dayOfWeek: dayOfWeek,
      },
    });

    let availability;

    if (existing) {
      // Update existing
      availability = await prisma.availability.update({
        where: { id: existing.id },
        data: {
          startTime,
          endTime,
          active: active ?? true,
        },
      });
    } else {
      // Create new
      availability = await prisma.availability.create({
        data: {
          tenantId: tenant.id,
          dayOfWeek,
          startTime,
          endTime,
          active: active ?? true,
        },
      });
    }

    return NextResponse.json(availability, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Error saving availability:", error);
    return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
  }
}

// PUT /api/availability - Bulk update availability (all days at once)
export async function PUT(request) {
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
    const { slots } = body; // Array of { dayOfWeek, startTime, endTime, active }

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "Slots must be an array" }, { status: 400 });
    }

    // Delete existing and recreate
    await prisma.availability.deleteMany({
      where: { tenantId: tenant.id },
    });

    // Create all new slots
    const created = await prisma.availability.createMany({
      data: slots.map((slot) => ({
        tenantId: tenant.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        active: slot.active ?? true,
      })),
    });

    // Fetch and return the new slots
    const availability = await prisma.availability.findMany({
      where: { tenantId: tenant.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
