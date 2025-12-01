import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/images - Get all images for the tenant
// Optional query params: ?type=logo to filter by image type
export async function GET(request) {
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type");

    const whereClause = {
      tenantId: tenant.id,
    };

    // Add type filter if provided
    if (typeFilter) {
      whereClause.type = typeFilter;
    }

    const images = await prisma.image.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

// POST /api/images - Save image metadata after upload
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
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { url, key, name, alt, size, width, height, mimeType } = body;

    if (!url || !key || !name || !alt) {
      return NextResponse.json(
        { error: "Missing required fields: url, key, name, alt" },
        { status: 400 }
      );
    }

    const image = await prisma.image.create({
      data: {
        tenantId: tenant.id,
        url,
        key,
        name,
        alt,
        size: size || 0,
        width: width || null,
        height: height || null,
        mimeType: mimeType || "image/jpeg",
      },
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("Error creating image:", error);
    return NextResponse.json({ error: "Failed to create image" }, { status: 500 });
  }
}
