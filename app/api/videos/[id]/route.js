import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteVideo, generateVideoUrl, generateVideoThumbnailUrl } from "@/lib/cloudinary";

// GET /api/videos/[id] - Get a single video
export async function GET(request, { params }) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
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
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}

// PATCH /api/videos/[id] - Update video metadata
export async function PATCH(request, { params }) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
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

    const body = await request.json();
    const { alt, name, type } = body;

    // Validate type if provided
    const validTypes = ["hero", "background", "testimonial", "tutorial", "promo", "general"];
    const validatedType = type && validTypes.includes(type) ? type : undefined;

    // If type is changing, regenerate the URL with new transformation
    let newUrl;
    let newThumbnailUrl;
    if (validatedType && validatedType !== existingVideo.type) {
      newUrl = generateVideoUrl(existingVideo.key, validatedType);
      newThumbnailUrl = generateVideoThumbnailUrl(existingVideo.key);
    }

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(name !== undefined && { name }),
        ...(validatedType !== undefined && { type: validatedType }),
        ...(newUrl && { url: newUrl }),
        ...(newThumbnailUrl && { thumbnailUrl: newThumbnailUrl }),
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update video" },
      { status: 500 }
    );
  }
}

// DELETE /api/videos/[id] - Delete a video
export async function DELETE(request, { params }) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
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

    // Delete from Cloudinary using the public_id (stored in key field)
    try {
      await deleteVideo(video.key);
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
      // Continue with database deletion even if CDN deletion fails
    }

    // Delete from database
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
