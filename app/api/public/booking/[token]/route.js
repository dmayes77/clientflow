import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * GET /api/public/booking/[token]
 * Get booking details by confirmation token (public endpoint)
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find booking by confirmation token
    const booking = await prisma.booking.findUnique({
      where: { confirmationToken: token },
      include: {
        tenant: {
          select: {
            businessName: true,
            name: true,
            slug: true,
            timezone: true,
            address: true,
            phone: true,
            email: true,
            logo: true,
          },
        },
        contact: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        package: {
          select: {
            name: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        packages: {
          include: {
            package: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Format booking data for public display
    const timezone = booking.tenant.timezone || "America/New_York";
    const zonedDate = toZonedTime(booking.scheduledAt, timezone);

    // Build service name
    const serviceNames = [];
    if (booking.services?.length > 0) {
      serviceNames.push(...booking.services.map((bs) => bs.service.name));
    } else if (booking.service) {
      serviceNames.push(booking.service.name);
    }
    if (booking.packages?.length > 0) {
      serviceNames.push(...booking.packages.map((bp) => bp.package.name));
    } else if (booking.package) {
      serviceNames.push(booking.package.name);
    }

    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      service: serviceNames.join(", ") || "Service",
      date: format(zonedDate, "EEEE, MMMM d, yyyy"),
      time: format(zonedDate, "h:mm a"),
      duration: booking.duration,
      totalPrice: booking.totalPrice,
      depositPaid: booking.depositAllocated || 0,
      balanceDue: booking.bookingBalanceDue ?? (booking.totalPrice - (booking.bookingAmountPaid || 0)),
      contact: {
        name: booking.contact.name,
        email: booking.contact.email,
      },
      business: {
        name: booking.tenant.businessName || booking.tenant.name,
        address: booking.tenant.address,
        phone: booking.tenant.phone,
        email: booking.tenant.email,
        logo: booking.tenant.logo,
        slug: booking.tenant.slug,
      },
    });
  } catch (error) {
    console.error("[GET /api/public/booking/[token]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
