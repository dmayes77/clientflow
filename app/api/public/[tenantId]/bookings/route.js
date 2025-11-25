import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    const {
      clientName,
      clientEmail,
      clientPhone,
      serviceId,
      packageId,
      scheduledAt,
      notes,
    } = body;

    // Validate required fields
    if (!clientName || !clientEmail || !scheduledAt) {
      return NextResponse.json(
        { error: "Client name, email, and scheduled time are required" },
        { status: 400 }
      );
    }

    if (!serviceId && !packageId) {
      return NextResponse.json(
        { error: "Either service or package must be selected" },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Find or create client
    let client = await prisma.client.findFirst({
      where: {
        email: clientEmail,
        tenantId,
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: clientName,
          email: clientEmail,
          phone: clientPhone || null,
          tenantId,
        },
      });
    }

    // Calculate total price and duration
    let totalPrice = 0;
    let totalDuration = 0;

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          tenantId,
        },
      });

      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }

      totalPrice = service.price;
      totalDuration = service.duration;
    } else if (packageId) {
      const pkg = await prisma.package.findFirst({
        where: {
          id: packageId,
          tenantId,
        },
        include: {
          services: true,
        },
      });

      if (!pkg) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }

      totalPrice = pkg.price;
      totalDuration = pkg.services.reduce((sum, service) => sum + service.duration, 0);
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId: client.id,
        tenantId,
        serviceId: serviceId || null,
        packageId: packageId || null,
        scheduledAt: new Date(scheduledAt),
        status: "pending",
        notes: notes || null,
        totalPrice,
        duration: totalDuration,
      },
      include: {
        client: true,
        service: true,
        package: {
          include: {
            services: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        status: booking.status,
        client: {
          name: booking.client.name,
          email: booking.client.email,
        },
        service: booking.service ? booking.service.name : null,
        package: booking.package ? booking.package.name : null,
      },
    });
  } catch (error) {
    console.error("Error creating public booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
