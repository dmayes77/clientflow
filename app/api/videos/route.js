import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateVideoUrl, generateVideoThumbnailUrl } from "@/lib/cloudinary";

// GET /api/videos - List all videos for the tenant
export async function GET() {
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

    const videos = await prisma.video.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

// POST /api/videos - Save video metadata after direct Cloudinary upload
export async function POST(request) {
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
      select: { id: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      publicId,
      url,
      alt,
      type = "general",
      bytes,
      width,
      height,
      duration,
      format,
      thumbnailUrl,
    } = body;

    // Validate required fields
    if (!publicId || !alt) {
      return NextResponse.json(
        { error: "Missing required fields: publicId and alt are required" },
        { status: 400 }
      );
    }

    // Validate alt text
    if (alt.trim().length < 3) {
      return NextResponse.json(
        { error: "Description must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Always generate URLs with transformations to ensure MP4 format
    // Don't use the raw Cloudinary URL as it may have original format (.mov, etc.)
    const videoUrl = generateVideoUrl(publicId, type);
    const thumbUrl = generateVideoThumbnailUrl(publicId);

    // Extract filename from publicId
    const nameParts = publicId.split("/");
    const filename = nameParts[nameParts.length - 1] + ".mp4";

    // Save to database
    const video = await prisma.video.create({
      data: {
        tenantId: tenant.id,
        url: videoUrl,
        thumbnailUrl: thumbUrl,
        key: publicId,
        name: filename,
        alt: alt.trim(),
        type,
        size: bytes || 0,
        width: width || null,
        height: height || null,
        duration: duration || null,
        mimeType: "video/mp4",
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error saving video:", error);
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
  }
}
