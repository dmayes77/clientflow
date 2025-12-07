import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { deleteImage } from "@/lib/cloudinary";

// GET /api/images/[id] - Get a single image
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/images/[id] - Update image metadata
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, alt, type } = body;

    const existingImage = await prisma.image.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (alt !== undefined) updateData.alt = alt;
    if (type !== undefined) updateData.type = type;

    const image = await prisma.image.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/images/[id] - Delete an image
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
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

    // Delete from Cloudinary
    await deleteImage(existingImage.key);

    // Delete from database
    await prisma.image.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
