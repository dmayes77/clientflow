import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/[slug]/booking/[bookingId]
 * Fetch booking information for the success page (used for free bookings without payment)
 */
export async function GET(request, { params }) {
  try {
    const { slug, bookingId } = await params;

    if (!slug || !bookingId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        businessName: true,
        logoUrl: true,
        email: true,
        phone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        timezone: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Find the booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenant.id,
      },
      include: {
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        package: {
          select: {
            name: true,
            price: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Build the response
    const serviceName = booking.service?.name || booking.package?.name || "Appointment";

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        serviceName,
        duration: booking.duration || booking.service?.duration,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
      business: {
        name: tenant.businessName,
        logoUrl: tenant.logoUrl,
        email: tenant.email,
        phone: tenant.phone,
        timezone: tenant.timezone,
        address: tenant.businessAddress ? {
          street: tenant.businessAddress,
          city: tenant.businessCity,
          state: tenant.businessState,
          zip: tenant.businessZip,
        } : null,
      },
      contact: booking.contact ? {
        id: booking.contact.id,
        name: booking.contact.name,
        email: booking.contact.email,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching booking info:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking information" },
      { status: 500 }
    );
  }
}
