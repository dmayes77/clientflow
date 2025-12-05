import { NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmation } from "@/lib/email";

const callTypes = {
  "product-demo": {
    title: "ClientFlow Product Demo",
    duration: 45,
  },
  "technical-questions": {
    title: "ClientFlow Technical Questions",
    duration: 30,
  },
  "custom-development": {
    title: "ClientFlow Custom Development Inquiry",
    duration: 45,
  },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, date, time, name, email, company, notes } = body;

    // Validate required fields
    if (!type || !date || !time || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const callType = callTypes[type];
    if (!callType) {
      return NextResponse.json(
        { error: "Invalid call type" },
        { status: 400 }
      );
    }

    // Parse date and time
    const [hours, minutes] = time.split(":");
    const startTime = new Date(date);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Build description
    let description = `Booking with ${name}`;
    if (company) description += `\nCompany: ${company}`;
    if (email) description += `\nEmail: ${email}`;
    if (notes) description += `\n\nNotes:\n${notes}`;

    // Create calendar event
    const event = await createCalendarEvent({
      title: callType.title,
      description,
      startTime: startTime.toISOString(),
      durationMinutes: callType.duration,
      attendeeEmail: email,
      attendeeName: name,
    });

    // Send confirmation email (don't block the response if email fails)
    sendBookingConfirmation({
      to: email,
      name,
      callType: callType.title,
      date,
      time,
      duration: callType.duration,
      meetLink: event.meetLink,
    }).catch((err) => console.error("Failed to send confirmation email:", err));

    return NextResponse.json({
      success: true,
      eventId: event.eventId,
      meetLink: event.meetLink,
      calendarLink: event.htmlLink,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    console.error("Error details:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    return NextResponse.json(
      { error: "Failed to create booking", details: error.message },
      { status: 500 }
    );
  }
}
