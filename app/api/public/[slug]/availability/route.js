import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/availability?date=2024-01-15 - Get availability for a date
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Find the tenant by slug
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

    // Parse the date in local timezone (avoid UTC interpretation of YYYY-MM-DD)
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Check for date override - use UTC for database storage
    const dateOnly = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    const override = await prisma.availabilityOverride.findUnique({
      where: {
        tenantId_date: {
          tenantId: tenant.id,
          date: dateOnly,
        },
      },
    });

    // If date is closed via override, return immediately
    if (override && override.type === "closed") {
      return NextResponse.json({
        bookedSlots: [],
        override: {
          type: "closed",
          reason: override.reason,
        },
        isClosed: true,
      });
    }

    // Get regular availability for this day of week
    const dayOfWeek = date.getDay();
    const regularAvailability = await prisma.availability.findFirst({
      where: {
        tenantId: tenant.id,
        dayOfWeek,
      },
    });

    // Determine the hours for this day
    let hours = null;
    if (override && override.type === "custom") {
      // Use custom override hours
      hours = {
        startTime: override.startTime,
        endTime: override.endTime,
        isOverride: true,
        reason: override.reason,
      };
    } else if (regularAvailability && regularAvailability.active) {
      // Use regular weekly hours
      hours = {
        startTime: regularAvailability.startTime,
        endTime: regularAvailability.endTime,
        isOverride: false,
      };
    }

    // If no availability and no override, the day is closed
    if (!hours) {
      return NextResponse.json({
        bookedSlots: [],
        override: null,
        isClosed: true,
      });
    }

    // Get all bookings for this day that aren't cancelled
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        status: { in: ["pending", "confirmed", "inquiry"] },
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        scheduledAt: true,
        duration: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    // Convert bookings to time ranges
    const bookedSlots = bookings.map((booking) => {
      const start = new Date(booking.scheduledAt);
      const end = new Date(start.getTime() + booking.duration * 60000);

      return {
        start: start.toISOString(),
        end: end.toISOString(),
        startTime: `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`,
        endTime: `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`,
      };
    });

    return NextResponse.json({
      bookedSlots,
      hours,
      isClosed: false,
      override: override ? {
        type: override.type,
        reason: override.reason,
      } : null,
      timezone: tenant.timezone,
      slotInterval: tenant.slotInterval,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
