import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/services/[id] - Get a specific service
export async function GET(request, { params }) {
  try {
    const { slug, id } = await params;

    if (!slug || !id) {
      return NextResponse.json(
        { error: "Slug and service ID are required" },
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

    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: tenant.id,
        active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Failed to fetch service" },
      { status: 500 }
    );
  }
}
