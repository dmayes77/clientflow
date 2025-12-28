import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await req.json();

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
        tenantId: user.tenantId,
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
