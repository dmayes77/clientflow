import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { getTenantFolder, getVideoTransformationForType } from "@/lib/cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/videos/sign - Generate a signed upload URL for direct Cloudinary upload
export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (!tenant.slug) {
      return NextResponse.json(
        { error: "Business setup incomplete. Please complete your business profile first." },
        { status: 400 }
      );
    }

    // Get the video type from the request body
    const body = await request.json();
    const { type = "general", publicId } = body;

    // Validate video type
    const validVideoTypes = ["hero", "background", "testimonial", "tutorial", "promo", "general"];
    const videoType = validVideoTypes.includes(type) ? type : "general";

    // Build folder path for tenant isolation
    const folder = getTenantFolder(tenant.slug) + "/videos";

    // Get transformation for the video type
    const transformation = getVideoTransformationForType(videoType);

    // Build transformation string
    const transformParts = [];
    if (transformation.width) transformParts.push(`w_${transformation.width}`);
    if (transformation.height) transformParts.push(`h_${transformation.height}`);
    if (transformation.crop) transformParts.push(`c_${transformation.crop}`);
    if (transformation.quality) transformParts.push(`q_${transformation.quality}`);
    const transformationStr = transformParts.join(",");

    // Generate timestamp for signature
    const timestamp = Math.round(Date.now() / 1000);

    // Parameters to sign - must match EXACTLY what client sends
    // Note: resource_type is NOT included - it's part of the URL, not signed params
    const params = {
      eager: "w_640,h_360,c_fill,f_jpg",
      eager_async: "true",
      folder,
      ...(publicId && { public_id: publicId }),
      timestamp,
      transformation: transformationStr,
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      transformation: transformationStr,
      eager: params.eager,
      eager_async: params.eager_async,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    });
  } catch (error) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
