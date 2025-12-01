import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendNewBookingNotification } from "@/lib/email";
import { dispatchBookingCreated, dispatchClientCreated } from "@/lib/webhooks";

// POST /api/public/[slug]/book - Create a public booking
export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const {
      serviceId,
      packageId,
      scheduledAt,
      clientName,
      clientEmail,
      clientPhone,
      notes,
    } = body;

    // Validate required fields
    if (!clientName || !clientEmail || !scheduledAt) {
      return NextResponse.json(
        { error: "Name, email, and appointment time are required" },
        { status: 400 }
      );
    }

    if (!serviceId && !packageId) {
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

    // Get the service or package to calculate price and duration
    let totalPrice = 0;
    let duration = 0;

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          tenantId: tenant.id,
          active: true,
        },
      });

      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }

      totalPrice = service.price;
      duration = service.duration;
    } else if (packageId) {
      const pkg = await prisma.package.findFirst({
        where: {
          id: packageId,
          tenantId: tenant.id,
          active: true,
        },
        include: {
          packageServices: {
            include: { service: true },
          },
        },
      });

      if (!pkg) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }

      totalPrice = pkg.price;
      duration = pkg.packageServices.reduce(
        (sum, ps) => sum + ps.service.duration,
        0
      );
    }

    // Check for conflicting bookings (double booking prevention)
    const appointmentStart = new Date(scheduledAt);
    const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000); // duration is in minutes

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
              // Check if existing booking overlaps with new one
              {
                scheduledAt: { gte: appointmentStart },
              },
              {
                // For bookings that started before but may extend into our slot
                // We need to calculate their end time
                scheduledAt: {
                  gte: new Date(appointmentStart.getTime() - 24 * 60 * 60000), // Look back 24 hours max
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

    // More precise overlap check for bookings that started earlier
    if (conflictingBooking) {
      const existingEnd = new Date(
        conflictingBooking.scheduledAt.getTime() + conflictingBooking.duration * 60000
      );

      // Check if there's actual overlap
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

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        serviceId: serviceId || null,
        packageId: packageId || null,
        scheduledAt: new Date(scheduledAt),
        status: "inquiry",
        notes: notes || null,
        totalPrice,
        duration,
        paymentStatus: "unpaid",
      },
      include: {
        service: { select: { name: true } },
        package: { select: { name: true } },
      },
    });

    const serviceName = booking.service?.name || booking.package?.name;
    const fullAddress = [
      tenant.businessAddress,
      tenant.businessCity,
      tenant.businessState,
      tenant.businessZip,
    ]
      .filter(Boolean)
      .join(", ");

    // Send email notifications (don't await - fire and forget for faster response)
    // Send booking confirmation to client
    sendBookingConfirmation({
      to: clientEmail,
      businessName: tenant.businessName,
      businessPhone: tenant.businessPhone,
      businessEmail: tenant.email,
      businessAddress: fullAddress || null,
      clientName,
      serviceName,
      scheduledAt: booking.scheduledAt,
      duration,
      totalPrice,
      notes,
      bookingId: booking.id.slice(-8).toUpperCase(),
    }).catch((err) => console.error("Failed to send booking confirmation:", err));

    // Send new booking notification to tenant
    if (tenant.email) {
      sendNewBookingNotification({
        to: tenant.email,
        businessName: tenant.businessName,
        clientName,
        clientEmail,
        clientPhone,
        serviceName,
        scheduledAt: booking.scheduledAt,
        duration,
        totalPrice,
        notes,
        dashboardUrl: `https://getclientflow.app/dashboard/bookings`,
      }).catch((err) => console.error("Failed to send new booking notification:", err));
    }

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
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
