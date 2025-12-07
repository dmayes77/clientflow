import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { uploadVideo, getVideoTransformationForType } from "@/lib/cloudinary";

// Video types available for upload
export const VIDEO_TYPES = [
  { value: "hero", label: "Hero Video" },
  { value: "background", label: "Background" },
  { value: "testimonial", label: "Testimonial" },
  { value: "tutorial", label: "Tutorial" },
  { value: "promo", label: "Promo" },
  { value: "general", label: "General" },
];

// GET /api/videos - List all videos
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where = { tenantId: tenant.id };
    if (type) {
      where.type = type;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/videos - Upload a new video
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const name = formData.get("name");
    const alt = formData.get("alt") || name;
    const type = formData.get("type") || "general";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get tenant slug for folder organization
    const slug = tenant.slug || tenant.id;

    // Upload to Cloudinary
    const uploadResult = await uploadVideo(buffer, slug, type);

    // Save to database
    const video = await prisma.video.create({
      data: {
        tenantId: tenant.id,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        key: uploadResult.publicId,
        name,
        alt,
        type,
        size: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration,
        mimeType: file.type,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Error uploading video:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
