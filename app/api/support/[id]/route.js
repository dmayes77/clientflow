import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/support/[id]
 * Update support message status/priority (admin only)
 */
export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority } = body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    // Set resolvedAt when status changes to resolved
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    } else if (status === "unread" || status === "read") {
      updateData.resolvedAt = null;
    }

    const message = await prisma.supportMessage.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error updating support message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/support/[id]
 * Delete support message (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.supportMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting support message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
