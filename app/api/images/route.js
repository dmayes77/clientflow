import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { uploadImage, getTransformationForType } from "@/lib/cloudinary";

// Image types available for upload
export const IMAGE_TYPES = [
  { value: "logo", label: "Logo" },
  { value: "hero", label: "Hero Image" },
  { value: "banner", label: "Banner" },
  { value: "gallery", label: "Gallery" },
  { value: "team", label: "Team/Portrait" },
  { value: "product", label: "Product" },
  { value: "general", label: "General" },
];

// GET /api/images - List all images
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

    const images = await prisma.image.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/images - Upload a new image
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
    const uploadResult = await uploadImage(buffer, slug, type, file.type);

    // Save to database
    const image = await prisma.image.create({
      data: {
        tenantId: tenant.id,
        url: uploadResult.url,
        key: uploadResult.publicId,
        name,
        alt,
        type,
        size: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        mimeType: file.type,
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
