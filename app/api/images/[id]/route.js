import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { deleteImage, generateImageUrl, shouldUsePng } from "@/lib/cloudinary";

// GET /api/images/[id] - Get a single image
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

    const image = await prisma.image.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}

// PATCH /api/images/[id] - Update image metadata (mainly alt text)
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

    const existingImage = await prisma.image.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const body = await request.json();
    const { alt, name, type } = body;

    // Validate type if provided
    const validTypes = ["logo", "hero", "banner", "gallery", "team", "product", "general"];
    const validatedType = type && validTypes.includes(type) ? type : undefined;

    // If type is changing, regenerate the URL with new transformation
    let newUrl;
    let newMimeType;
    let newName;
    if (validatedType && validatedType !== existingImage.type) {
      // Logos always use PNG for transparency, others use WebP
      const isPng = shouldUsePng(validatedType);
      const outputFormat = isPng ? "png" : "webp";

      newUrl = generateImageUrl(existingImage.key, validatedType);
      newMimeType = isPng ? "image/png" : "image/webp";

      // Update file extension in name if format changed
      if (existingImage.name) {
        const baseName = existingImage.name.replace(/\.(png|webp|jpg|jpeg)$/i, "");
        newName = `${baseName}.${outputFormat}`;
      }
    }

    console.log("Updating image:", { id, alt, name, type, validatedType, newUrl, newMimeType });

    const image = await prisma.image.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(name !== undefined && { name: name }),
        ...(validatedType !== undefined && { type: validatedType }),
        ...(newUrl && { url: newUrl }),
        ...(newMimeType && { mimeType: newMimeType }),
        ...(newName && !name && { name: newName }), // Only auto-update name if user didn't provide one
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update image" },
      { status: 500 }
    );
  }
}

// DELETE /api/images/[id] - Delete an image
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

    const image = await prisma.image.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from Cloudinary using the public_id (stored in key field)
    try {
      await deleteImage(image.key);
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
      // Continue with database deletion even if CDN deletion fails
    }

    // Delete from database
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
