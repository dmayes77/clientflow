import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/availability/overrides/[id] - Delete a date override
export async function DELETE(request, { params }) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify the override belongs to this tenant
    const override = await prisma.availabilityOverride.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!override) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    await prisma.availabilityOverride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting availability override:", error);
    return NextResponse.json({ error: "Failed to delete override" }, { status: 500 });
  }
}

// PATCH /api/availability/overrides/[id] - Update a date override
export async function PATCH(request, { params }) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify the override belongs to this tenant
    const existingOverride = await prisma.availabilityOverride.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingOverride) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, startTime, endTime, reason } = body;

    if (type && !["closed", "custom"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'closed' or 'custom'" },
        { status: 400 }
      );
    }

    const updateType = type || existingOverride.type;

    if (updateType === "custom" && (!startTime && !existingOverride.startTime || !endTime && !existingOverride.endTime)) {
      return NextResponse.json(
        { error: "Start time and end time are required for custom hours" },
        { status: 400 }
      );
    }

    const override = await prisma.availabilityOverride.update({
      where: { id },
      data: {
        type: updateType,
        startTime: updateType === "custom" ? (startTime || existingOverride.startTime) : null,
        endTime: updateType === "custom" ? (endTime || existingOverride.endTime) : null,
        reason: reason !== undefined ? reason : existingOverride.reason,
      },
    });

    return NextResponse.json(override);
  } catch (error) {
    console.error("Error updating availability override:", error);
    return NextResponse.json({ error: "Failed to update override" }, { status: 500 });
  }
}
