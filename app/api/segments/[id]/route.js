import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const updateSegmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  filters: z.object({
    status: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    minBookings: z.number().int().optional(),
    maxBookings: z.number().int().optional(),
    search: z.string().optional(),
  }).optional(),
});

// GET /api/segments/[id] - Get single segment
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const segment = await prisma.contactSegment.findUnique({
      where: { id },
    });

    if (!segment || segment.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    return NextResponse.json(segment);
  } catch (error) {
    console.error("Error fetching segment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/segments/[id] - Update segment
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const segment = await prisma.contactSegment.findUnique({
      where: { id },
    });

    if (!segment || segment.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    if (segment.isSystem) {
      return NextResponse.json({ error: "Cannot modify system segments" }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateSegmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const updatedSegment = await prisma.contactSegment.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedSegment);
  } catch (error) {
    console.error("Error updating segment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/segments/[id] - Delete segment
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const segment = await prisma.contactSegment.findUnique({
      where: { id },
    });

    if (!segment || segment.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    if (segment.isSystem) {
      return NextResponse.json({ error: "Cannot delete system segments" }, { status: 400 });
    }

    await prisma.contactSegment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting segment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
