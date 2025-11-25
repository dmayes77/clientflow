import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { tenantId } = await params;

    // Fetch tenant to verify it exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Fetch all services for this tenant
    const services = await prisma.service.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Fetch all packages for this tenant
    const packages = await prisma.package.findMany({
      where: {
        tenantId,
      },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      services,
      packages,
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    });
  } catch (error) {
    console.error("Error fetching public services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
