import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/availability - Get available time slots for a date
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Parse the date
    const requestedDate = new Date(dateParam);
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        timezone: true,
        slotInterval: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const dayOfWeek = requestedDate.getDay();

    // Check for availability override
    const override = await prisma.availabilityOverride.findUnique({
      where: {
        tenantId_date: {
          tenantId: tenant.id,
          date: new Date(dateParam),
        },
      },
    });

    // If there's a "closed" override, return closed status
    if (override?.type === "closed") {
      return NextResponse.json({
        isClosed: true,
        reason: override.reason || "Closed",
        bookedSlots: [],
        openTime: null,
        closeTime: null,
        timezone: tenant.timezone,
        slotInterval: tenant.slotInterval,
      });
    }

    // Get regular availability for this day
    const regularAvailability = await prisma.availability.findUnique({
      where: {
        tenantId_dayOfWeek: {
          tenantId: tenant.id,
          dayOfWeek,
        },
      },
    });

    // Determine operating hours
    let openTime = null;
    let closeTime = null;
    let isClosed = true;

    if (override?.type === "custom") {
      // Use override hours
      openTime = override.startTime;
      closeTime = override.endTime;
      isClosed = false;
    } else if (regularAvailability?.active) {
      // Use regular hours
      openTime = regularAvailability.startTime;
      closeTime = regularAvailability.endTime;
      isClosed = false;
    }

    if (isClosed) {
      return NextResponse.json({
        isClosed: true,
        reason: "Not available on this day",
        bookedSlots: [],
        openTime: null,
        closeTime: null,
        timezone: tenant.timezone,
        slotInterval: tenant.slotInterval,
      });
    }

    // Get existing bookings for this date
    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateParam);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["pending", "confirmed", "inquiry"],
        },
      },
      select: {
        scheduledAt: true,
        duration: true,
      },
    });

    // Convert bookings to occupied time slots
    const bookedSlots = bookings.map((booking) => {
      const start = new Date(booking.scheduledAt);
      const end = new Date(start.getTime() + booking.duration * 60000);

      return {
        start: start.toISOString(),
        end: end.toISOString(),
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
      };
    });

    return NextResponse.json({
      isClosed: false,
      bookedSlots,
      openTime,
      closeTime,
      timezone: tenant.timezone,
      slotInterval: tenant.slotInterval,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
