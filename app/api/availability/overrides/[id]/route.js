import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// DELETE /api/availability/overrides/[id] - Delete a date override
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingOverride = await prisma.availabilityOverride.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingOverride) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    await prisma.availabilityOverride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting override:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
