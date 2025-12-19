import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createAvailabilitySchema, validateRequest } from "@/lib/validations";

// GET /api/availability - Get weekly availability schedule
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const availability = await prisma.availability.findMany({
      where: { tenantId: tenant.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/availability - Update weekly availability schedule (bulk)
export async function PUT(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    // Accept either "slots" or "availability" as the array key
    const slots = body.slots || body.availability;

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "Slots must be an array" }, { status: 400 });
    }

    // Validate each slot
    for (const slot of slots) {
      const { success, errors } = validateRequest(slot, createAvailabilitySchema);
      if (!success) {
        return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
      }
    }

    // Upsert all slots in a transaction
    const result = await prisma.$transaction(
      slots.map((slot) =>
        prisma.availability.upsert({
          where: {
            tenantId_dayOfWeek: {
              tenantId: tenant.id,
              dayOfWeek: slot.dayOfWeek,
            },
          },
          update: {
            startTime: slot.startTime,
            endTime: slot.endTime,
            active: slot.active,
          },
          create: {
            tenantId: tenant.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            active: slot.active,
          },
        })
      )
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/availability - Create a single availability slot
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createAvailabilitySchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Check if slot already exists for this day
    const existing = await prisma.availability.findFirst({
      where: {
        tenantId: tenant.id,
        dayOfWeek: data.dayOfWeek,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Availability already exists for this day" }, { status: 400 });
    }

    const availability = await prisma.availability.create({
      data: {
        tenantId: tenant.id,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        active: data.active ?? true,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error("Error creating availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
