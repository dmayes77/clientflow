import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/availability?date=2024-01-15 - Get booked time slots for a date
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
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Parse the date and get start/end of day
    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

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

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
