import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/services - Get active services
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        services: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            images: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                url: true,
                alt: true,
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

    return NextResponse.json(tenant.services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
