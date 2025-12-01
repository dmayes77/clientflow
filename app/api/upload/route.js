import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  uploadImage,
  shouldUsePng,
  generateImageUrl,
  uploadVideo,
  generateVideoUrl,
  generateVideoThumbnailUrl,
} from "@/lib/cloudinary";

// Allow up to 60 seconds for video uploads
export const maxDuration = 60;

/**
 * Convert alt text to a URL-friendly filename
 * "My Business Logo" -> "my-business-logo"
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
}

// POST /api/upload - Upload image or video to Cloudinary with tenant isolation
export async function POST(request) {
  console.log("[Upload] Starting upload request...");

  try {
    // Parse formData FIRST before auth() to avoid stream consumption issues
    console.log("[Upload] Parsing formData first...");
    let formData;
    try {
      formData = await request.formData();
      console.log("[Upload] FormData parsed successfully");
    } catch (formError) {
      console.error("[Upload] FormData parse error:", formError);
      return NextResponse.json(
        { error: "Failed to parse upload data. File may be too large or corrupted." },
        { status: 400 }
      );
    }

    console.log("[Upload] Checking auth...");
    const { userId, orgId } = await auth();

    if (!userId) {
      console.log("[Upload] No userId - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      console.log("[Upload] No orgId - no organization selected");
      return NextResponse.json(
        { error: "No organization selected" },
        { status: 400 }
      );
    }

    console.log("[Upload] Auth passed, userId:", userId, "orgId:", orgId);

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      console.log("[Upload] Tenant not found for orgId:", orgId);
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Require slug for uploads - it's set during business setup
    if (!tenant.slug) {
      console.log("[Upload] Tenant has no slug:", tenant.id);
      return NextResponse.json(
        { error: "Business setup incomplete. Please complete your business profile first." },
        { status: 400 }
      );
    }

    console.log("[Upload] Tenant found:", tenant.slug);
    const file = formData.get("file");
    const alt = formData.get("alt");
    const mediaType = formData.get("type") || "general";

    console.log("[Upload] File:", file?.name, "Size:", file?.size, "Type:", file?.type);
    console.log("[Upload] Alt:", alt, "MediaType:", mediaType);

    if (!file) {
      console.log("[Upload] No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Require alt/description text for accessibility
    if (!alt || alt.trim().length < 3) {
      console.log("[Upload] Alt text missing or too short");
      return NextResponse.json(
        { error: "Description is required (minimum 3 characters)" },
        { status: 400 }
      );
    }

    // Detect if this is a video or image upload
    const isVideo = file.type?.startsWith("video/");
    console.log("[Upload] Is video:", isVideo);

    // Generate filename from alt text
    const slugifiedName = slugify(alt);
    const timestamp = Date.now();
    const publicIdName = `${slugifiedName}-${timestamp}`;
    console.log("[Upload] Public ID:", publicIdName);

    // Convert file to buffer
    console.log("[Upload] Converting file to buffer...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("[Upload] Buffer created, size:", buffer.length);

    if (isVideo) {
      // VIDEO UPLOAD
      console.log("[Upload] Processing VIDEO upload...");

      // Validate file size (100MB max for videos)
      const maxVideoSize = 100 * 1024 * 1024;
      if (file.size > maxVideoSize) {
        console.log("[Upload] Video too large:", file.size);
        return NextResponse.json(
          { error: "Video file too large. Maximum size is 100MB." },
          { status: 400 }
        );
      }

      // Valid video types
      const validVideoTypes = ["hero", "background", "testimonial", "tutorial", "promo", "general"];
      const type = validVideoTypes.includes(mediaType) ? mediaType : "general";
      console.log("[Upload] Video type:", type);

      // Upload to Cloudinary
      console.log("[Upload] Uploading to Cloudinary...");
      let result;
      try {
        result = await uploadVideo(buffer, tenant.slug, type, {
          public_id: publicIdName,
          tags: [type, tenant.slug, "video"],
        });
        console.log("[Upload] Cloudinary upload success:", result.publicId);
      } catch (cloudinaryError) {
        console.error("[Upload] Cloudinary upload error:", cloudinaryError);
        return NextResponse.json(
          { error: "Failed to upload video to storage" },
          { status: 500 }
        );
      }

      // Generate URL with transformations
      const videoUrl = generateVideoUrl(result.publicId, type);
      const thumbnailUrl = result.thumbnailUrl || generateVideoThumbnailUrl(result.publicId);
      console.log("[Upload] Generated URLs:", { videoUrl, thumbnailUrl });

      // Save metadata to database
      console.log("[Upload] Saving to database...");
      const video = await prisma.video.create({
        data: {
          tenantId: tenant.id,
          url: videoUrl,
          thumbnailUrl,
          key: result.publicId,
          name: `${slugifiedName}.mp4`,
          alt: alt.trim(),
          type,
          size: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
          mimeType: "video/mp4",
        },
      });
      console.log("[Upload] Video saved to DB:", video.id);

      return NextResponse.json(video, { status: 201 });
    } else {
      // IMAGE UPLOAD
      // Valid image types
      const validImageTypes = ["logo", "hero", "banner", "gallery", "team", "product", "general"];
      const type = validImageTypes.includes(mediaType) ? mediaType : "general";

      // Get the original MIME type for transparency preservation
      const mimeType = file.type || "image/jpeg";

      // Upload to Cloudinary with tenant folder isolation using slug
      const result = await uploadImage(buffer, tenant.slug, type, mimeType, {
        resource_type: "image",
        public_id: publicIdName,
        tags: [type, tenant.slug],
      });

      // Determine output format (logos always use PNG for transparency, others use WebP)
      const isPng = shouldUsePng(type);
      const outputFormat = isPng ? "png" : "webp";
      const outputMimeType = isPng ? "image/png" : "image/webp";

      // Generate URL with transformations
      const imageUrl = generateImageUrl(result.publicId, type);

      // Save metadata to database
      const image = await prisma.image.create({
        data: {
          tenantId: tenant.id,
          url: imageUrl,
          key: result.publicId,
          name: `${slugifiedName}.${outputFormat}`,
          alt: alt.trim(),
          type,
          size: result.bytes,
          width: result.width,
          height: result.height,
          mimeType: outputMimeType,
        },
      });

      return NextResponse.json(image, { status: 201 });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
