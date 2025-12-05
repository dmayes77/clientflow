import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/google-calendar";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const duration = parseInt(searchParams.get("duration") || "30");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);

    // Validate date
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(date, duration);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching availability:", error.message);
    console.error("Full error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability", details: error.message },
      { status: 500 }
    );
  }
}
