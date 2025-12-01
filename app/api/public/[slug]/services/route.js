import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/services - Get all active services for a tenant
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
        services: {
          where: { active: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ services: tenant.services });
  } catch (error) {
    console.error("Error fetching public services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
