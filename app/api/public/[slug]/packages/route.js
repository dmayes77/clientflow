import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/packages - Get all active packages for a tenant
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        packages: {
          where: { active: true },
          orderBy: { name: "asc" },
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Calculate total duration and flatten services
    const packages = tenant.packages.map((pkg) => ({
      ...pkg,
      totalDuration: pkg.services.reduce(
        (sum, ps) => sum + ps.service.duration,
        0
      ),
      services: pkg.services.map((ps) => ps.service),
    }));

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Error fetching public packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}
