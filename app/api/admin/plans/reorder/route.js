import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// POST /api/admin/plans/reorder - Update plan ordering
export async function POST(request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { planIds } = await request.json();

    if (!Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: "planIds array is required" },
        { status: 400 }
      );
    }

    // Update each plan's sortOrder based on position in array
    const updates = planIds.map((id, index) =>
      prisma.plan.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);

    // Fetch updated plans
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error reordering plans:", error);
    return NextResponse.json(
      { error: "Failed to reorder plans" },
      { status: 500 }
    );
  }
}
