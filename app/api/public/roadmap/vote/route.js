import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Vote on a roadmap item
export async function POST(request) {
  try {
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    // Increment vote count
    const item = await prisma.roadmapItem.update({
      where: { id: itemId },
      data: {
        votes: {
          increment: 1,
        },
      },
      select: {
        id: true,
        votes: true,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error voting on roadmap item:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
