import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];

async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return { isAdmin: false, userId: null };
  return { isAdmin: ADMIN_USER_IDS.includes(userId), userId };
}

// GET - Fetch all roadmap items
export async function GET(request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status && status !== "all" ? { status } : {};

    const items = await prisma.roadmapItem.findMany({
      where,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    // Get counts by status
    const counts = await prisma.roadmapItem.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusCounts = {};
    counts.forEach(c => {
      statusCounts[c.status] = c._count;
    });

    return NextResponse.json({ items, statusCounts });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create roadmap item
export async function POST(request) {
  try {
    const { isAdmin: admin, userId } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, category, priority, targetDate } = body;

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const item = await prisma.roadmapItem.create({
      data: {
        title,
        description,
        status: status || "planned",
        category,
        priority: priority || 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        createdBy: userId,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error creating roadmap item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update roadmap item
export async function PATCH(request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData = {};
    const allowedFields = ["title", "description", "status", "category", "priority", "targetDate"];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === "targetDate" && updates[field]) {
          updateData[field] = new Date(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    // Handle status changes
    if (updates.status === "completed" && !updates.completedAt) {
      updateData.completedAt = new Date();
    }

    const item = await prisma.roadmapItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating roadmap item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete roadmap item
export async function DELETE(request) {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.roadmapItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting roadmap item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
