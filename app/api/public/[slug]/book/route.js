import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchBookingCreated, dispatchClientCreated } from "@/lib/webhooks";

// POST /api/public/[slug]/book - Create a public booking
export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      serviceId,
      packageId,
      serviceIds,
      packageIds,
      scheduledAt,
      clientName,
      clientEmail,
      clientPhone,
      notes,
      totalDuration,
      totalPrice,
    } = body;

    // Normalize to arrays for multi-selection support
    const selectedServiceIds = serviceIds?.length > 0
      ? serviceIds
      : (serviceId ? [serviceId] : []);
    const selectedPackageIds = packageIds?.length > 0
      ? packageIds
      : (packageId ? [packageId] : []);

    // Validate required fields
    if (!clientName || !clientEmail || !scheduledAt) {
      return NextResponse.json(
        { error: "Name, email, and appointment time are required" },
        { status: 400 }
      );
    }

    if (selectedServiceIds.length === 0 && selectedPackageIds.length === 0) {
      return NextResponse.json(
        { error: "Please select a service or package" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        email: true,
        businessName: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get the services and packages to calculate price and duration
    let calculatedPrice = 0;
    let calculatedDuration = 0;
    const selectedServices = [];
    const selectedPackages = [];

    // Fetch and validate all selected services
    if (selectedServiceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: {
          id: { in: selectedServiceIds },
          tenantId: tenant.id,
          active: true,
        },
      });

      if (services.length !== selectedServiceIds.length) {
        return NextResponse.json({ error: "One or more services not found" }, { status: 404 });
      }

      services.forEach((service) => {
        calculatedPrice += service.price;
        calculatedDuration += service.duration;
        selectedServices.push(service);
      });
    }

    // Fetch and validate all selected packages
    if (selectedPackageIds.length > 0) {
      const pkgs = await prisma.package.findMany({
        where: {
          id: { in: selectedPackageIds },
          tenantId: tenant.id,
          active: true,
        },
        include: {
          services: {
            include: { service: true },
          },
        },
      });

      if (pkgs.length !== selectedPackageIds.length) {
        return NextResponse.json({ error: "One or more packages not found" }, { status: 404 });
      }

      pkgs.forEach((pkg) => {
        calculatedPrice += pkg.price;
        calculatedDuration += pkg.services.reduce((sum, ps) => sum + ps.service.duration, 0);
        selectedPackages.push(pkg);
      });
    }

    // Use provided totals if available (for UI-calculated values), otherwise use calculated
    const finalPrice = totalPrice || calculatedPrice;
    const finalDuration = totalDuration || calculatedDuration;

    // Check for conflicting bookings
    const appointmentStart = new Date(scheduledAt);
    const appointmentEnd = new Date(appointmentStart.getTime() + finalDuration * 60000);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        tenantId: tenant.id,
        status: { in: ["pending", "confirmed", "inquiry"] },
        AND: [
          {
            scheduledAt: { lt: appointmentEnd },
          },
          {
            OR: [
              {
                scheduledAt: { gte: appointmentStart },
              },
              {
                scheduledAt: {
                  gte: new Date(appointmentStart.getTime() - 24 * 60 * 60000),
                  lt: appointmentStart,
                },
              },
            ],
          },
        ],
      },
      select: {
        scheduledAt: true,
        duration: true,
      },
    });

    if (conflictingBooking) {
      const existingEnd = new Date(
        conflictingBooking.scheduledAt.getTime() + conflictingBooking.duration * 60000
      );

      if (conflictingBooking.scheduledAt < appointmentEnd && existingEnd > appointmentStart) {
        return NextResponse.json(
          { error: "This time slot is no longer available. Please choose a different time." },
          { status: 409 }
        );
      }
    }

    // Find or create the client
    let client = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email: clientEmail.toLowerCase(),
      },
    });

    let isNewClient = false;
    if (!client) {
      client = await prisma.client.create({
        data: {
          tenantId: tenant.id,
          name: clientName,
          email: clientEmail.toLowerCase(),
          phone: clientPhone || null,
        },
      });
      isNewClient = true;
    }

    // Create the booking (store first service/package for backward compatibility)
    const primaryServiceId = selectedServiceIds.length > 0 ? selectedServiceIds[0] : null;
    const primaryPackageId = selectedPackageIds.length > 0 && selectedServiceIds.length === 0
      ? selectedPackageIds[0]
      : null;

    const booking = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        serviceId: primaryServiceId,
        packageId: primaryPackageId,
        scheduledAt: new Date(scheduledAt),
        status: "inquiry",
        notes: notes || null,
        totalPrice: finalPrice,
        duration: finalDuration,
        paymentStatus: "unpaid",
      },
      include: {
        service: { select: { name: true } },
        package: { select: { name: true } },
      },
    });

    // Build service name for response
    const allNames = [
      ...selectedServices.map(s => s.name),
      ...selectedPackages.map(p => p.name),
    ];
    const serviceName = allNames.length > 0
      ? allNames.length === 1
        ? allNames[0]
        : `${allNames.length} items`
      : booking.service?.name || booking.package?.name;

    // Dispatch webhook events (fire and forget)
    dispatchBookingCreated(tenant.id, {
      ...booking,
      client: { id: client.id, name: client.name, email: client.email },
    }).catch((err) => console.error("Failed to dispatch booking.created webhook:", err));

    if (isNewClient) {
      dispatchClientCreated(tenant.id, client).catch((err) =>
        console.error("Failed to dispatch client.created webhook:", err)
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        serviceName,
        totalPrice: booking.totalPrice,
        status: booking.status,
      },
      message: "Your booking request has been submitted! We'll confirm your appointment shortly.",
    });
  } catch (error) {
    console.error("Error creating public booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
