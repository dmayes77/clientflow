import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/packages/[id] - Get a specific package
export async function GET(request, { params }) {
  try {
    const { slug, id } = await params;

    if (!slug || !id) {
      return NextResponse.json(
        { error: "Slug and package ID are required" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const pkg = await prisma.package.findFirst({
      where: {
        id,
        tenantId: tenant.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Calculate total duration and flatten services
    const package_ = {
      ...pkg,
      totalDuration: pkg.services.reduce(
        (sum, ps) => sum + ps.service.duration,
        0
      ),
      services: pkg.services.map((ps) => ps.service),
    };

    return NextResponse.json({ package: package_ });
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}
