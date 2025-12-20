import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Verify admin access
function isAdmin(userId) {
  const adminIds = process.env.ADMIN_USER_IDS?.split(",") || [];
  return adminIds.includes(userId);
}

// POST /api/admin/plans/reorder - Update plan ordering
export async function POST(request) {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
