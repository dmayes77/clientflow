import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { deleteVideo } from "@/lib/cloudinary";

// GET /api/videos/[id] - Get a single video
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const video = await prisma.video.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/videos/[id] - Update video metadata
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, alt, type } = body;

    const existingVideo = await prisma.video.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (alt !== undefined) updateData.alt = alt;
    if (type !== undefined) updateData.type = type;

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/videos/[id] - Delete a video
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingVideo = await prisma.video.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingVideo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Delete from Cloudinary
    await deleteVideo(existingVideo.key);

    // Delete from database
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
