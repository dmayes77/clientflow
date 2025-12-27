import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const createSegmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: z.object({
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    minBookings: z.number().int().optional(),
    maxBookings: z.number().int().optional(),
    search: z.string().optional(),
  }),
});

// GET /api/segments - List all segments
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const segments = await prisma.contactSegment.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(segments);
  } catch (error) {
    console.error("Error fetching segments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/segments - Create segment
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const validation = createSegmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check for name uniqueness
    const existing = await prisma.contactSegment.findUnique({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: data.name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A segment with this name already exists" },
        { status: 400 }
      );
    }

    const segment = await prisma.contactSegment.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        description: data.description,
        filters: data.filters,
      },
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error("Error creating segment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
