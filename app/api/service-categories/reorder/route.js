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

    // Validate that all categories belong to the tenant
    const categoryIds = updates.map((u) => u.id);
    const categories = await prisma.serviceCategory.findMany({
      where: {
        id: { in: categoryIds },
        tenantId: tenant.id,
      },
      select: { id: true },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "Some categories not found or unauthorized" },
        { status: 404 }
      );
    }

    // Perform batch update
    await prisma.$transaction(
      updates.map((update) =>
        prisma.serviceCategory.update({
          where: { id: update.id },
          data: { displayOrder: update.displayOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder categories error:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
