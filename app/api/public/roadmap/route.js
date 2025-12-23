import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch public roadmap items (no auth required)
export async function GET(request) {
  try {
    // Only show non-archived items
    const items = await prisma.roadmapItem.findMany({
      where: {
        status: {
          not: "archived",
        },
      },
      orderBy: [
        { status: "asc" }, // Group by status
        { votes: "desc" }, // Then by votes
        { priority: "asc" }, // Then by priority
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        category: true,
        votes: true,
        targetDate: true,
      },
    });

    // Group by status
    const grouped = {
      completed: items.filter((i) => i.status === "completed"),
      in_progress: items.filter((i) => i.status === "in_progress"),
      planned: items.filter((i) => i.status === "planned"),
    };

    return NextResponse.json({ items, grouped });
  } catch (error) {
    console.error("Error fetching public roadmap:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
