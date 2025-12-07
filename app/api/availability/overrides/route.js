import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createAvailabilityOverrideSchema, validateRequest } from "@/lib/validations";

// GET /api/availability/overrides - Get all date overrides
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const overrides = await prisma.availabilityOverride.findMany({
      where: { tenantId: tenant.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(overrides);
  } catch (error) {
    console.error("Error fetching overrides:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/availability/overrides - Create a date override
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createAvailabilityOverrideSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Check if override already exists for this date
    const existingOverride = await prisma.availabilityOverride.findFirst({
      where: {
        tenantId: tenant.id,
        date: data.date,
      },
    });

    if (existingOverride) {
      return NextResponse.json({ error: "An override already exists for this date" }, { status: 400 });
    }

    const override = await prisma.availabilityOverride.create({
      data: {
        tenantId: tenant.id,
        date: data.date,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
      },
    });

    return NextResponse.json(override, { status: 201 });
  } catch (error) {
    console.error("Error creating override:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
