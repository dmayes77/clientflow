import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

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

    const image = await prisma.image.findFirst({
      where: {
        id: params.id,
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

    const existingImage = await prisma.image.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    });

    if (!existingImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const body = await request.json();
    const { alt, name } = body;

    const image = await prisma.image.update({
      where: { id: params.id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(name !== undefined && { name }),
      },
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
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

    const image = await prisma.image.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete from UploadThing
    try {
      await utapi.deleteFiles(image.key);
    } catch (error) {
      console.error("Error deleting from UploadThing:", error);
      // Continue with database deletion even if CDN deletion fails
    }

    // Delete from database
    await prisma.image.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
