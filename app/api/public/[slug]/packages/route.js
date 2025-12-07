import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/packages - Get active packages
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        packages: {
          where: { active: true },
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
          orderBy: { name: "asc" },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Transform packages to include flattened services and total duration
    const packages = tenant.packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      services: pkg.services.map((ps) => ps.service),
      totalDuration: pkg.services.reduce((sum, ps) => sum + ps.service.duration, 0),
      savings: pkg.services.reduce((sum, ps) => sum + ps.service.price, 0) - pkg.price,
    }));

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
