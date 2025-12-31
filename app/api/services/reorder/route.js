import { NextResponse } from "next/server";
import { getAuthenticatedTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { updates } = await request.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Invalid updates array" },
        { status: 400 }
      );
    }

    // Validate that all services belong to the tenant
    const serviceIds = updates.map((u) => u.id);
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        tenantId: tenant.id,
      },
      select: { id: true },
    });

    if (services.length !== serviceIds.length) {
      return NextResponse.json(
        { error: "Some services not found or unauthorized" },
        { status: 404 }
      );
    }

    // Perform batch update
    await prisma.$transaction(
      updates.map((update) =>
        prisma.service.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder services error:", error);
    return NextResponse.json(
      { error: "Failed to reorder services" },
      { status: 500 }
    );
  }
}
