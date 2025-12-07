import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createBookingSchema, validateRequest } from "@/lib/validations";

// GET /api/bookings - List all bookings
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const statusFilter = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where = {
      tenantId: tenant.id,
      ...(clientId && { clientId }),
      ...(statusFilter && { status: statusFilter }),
      ...(from || to
        ? {
            scheduledAt: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        client: true,
        service: true,
        package: true,
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createBookingSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        tenantId: tenant.id,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify service/package if provided
    if (data.serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: data.serviceId,
          tenantId: tenant.id,
        },
      });

      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
    }

    if (data.packageId) {
      const pkg = await prisma.package.findFirst({
        where: {
          id: data.packageId,
          tenantId: tenant.id,
        },
      });

      if (!pkg) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: data.clientId,
        serviceId: data.serviceId,
        packageId: data.packageId,
        scheduledAt: data.scheduledAt,
        status: data.status || "inquiry",
        notes: data.notes,
        totalPrice: data.totalPrice,
        duration: data.duration,
      },
      include: {
        client: true,
        service: true,
        package: true,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
