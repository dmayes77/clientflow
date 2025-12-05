import { google } from "googleapis";

// Initialize Google Calendar API with service account + domain-wide delegation
function getCalendarClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  // Use JWT auth with subject impersonation for domain-wide delegation
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    subject: calendarId, // Impersonate the calendar owner
  });

  return google.calendar({ version: "v3", auth });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

// Business hours configuration by day of week
// 0 = Sunday, 1 = Monday, ... 6 = Saturday
const BUSINESS_HOURS = {
  slotDuration: 30, // minutes
  schedule: {
    0: null, // Sunday - no availability
    1: { start: 9, end: 12 }, // Monday: 9am - 12pm
    2: { start: 9, end: 12 }, // Tuesday: 9am - 12pm
    3: { start: 9, end: 12 }, // Wednesday: 9am - 12pm
    4: { start: 9, end: 12 }, // Thursday: 9am - 12pm
    5: { start: 9, end: 12 }, // Friday: 9am - 12pm
    6: { start: 9, end: 14 }, // Saturday: 9am - 2pm
  },
};

/**
 * Get busy times for a date range
 */
export async function getBusyTimes(startDate, endDate) {
  const calendar = getCalendarClient();

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: CALENDAR_ID }],
    },
  });

  return response.data.calendars[CALENDAR_ID]?.busy || [];
}

/**
 * Get available time slots for a specific date
 */
export async function getAvailableSlots(date, durationMinutes = 30) {
  const now = new Date();
  const dayOfWeek = date.getDay();

  // Get schedule for this day of week
  const daySchedule = BUSINESS_HOURS.schedule[dayOfWeek];

  // Require 24-hour advance booking
  const minBookingTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // No availability if day has no schedule (Sunday) or date is within 24 hours
  if (!daySchedule || date < minBookingTime) {
    return [];
  }

  // Set the date range based on day-specific schedule
  const startOfDay = new Date(date);
  startOfDay.setHours(daySchedule.start, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(daySchedule.end, 0, 0, 0);

  // Get busy times from Google Calendar
  const busyTimes = await getBusyTimes(startOfDay, endOfDay);

  // Generate all possible slots
  const slots = [];
  let currentSlot = new Date(startOfDay);

  while (currentSlot.getTime() + durationMinutes * 60000 <= endOfDay.getTime()) {
    const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);

    // Check if this slot overlaps with any busy time
    const isAvailable = !busyTimes.some((busy) => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return currentSlot < busyEnd && slotEnd > busyStart;
    });

    // Don't show slots that are in the past
    if (isAvailable && currentSlot > now) {
      slots.push({
        start: currentSlot.toISOString(),
        time: `${currentSlot.getHours()}:${currentSlot.getMinutes().toString().padStart(2, "0")}`,
      });
    }

    // Move to next slot
    currentSlot = new Date(currentSlot.getTime() + BUSINESS_HOURS.slotDuration * 60000);
  }

  return slots;
}

/**
 * Create a calendar event with Google Meet
 */
export async function createCalendarEvent({
  title,
  description,
  startTime,
  durationMinutes,
  attendeeEmail,
  attendeeName,
}) {
  const calendar = getCalendarClient();

  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const event = {
    summary: title,
    description: description || `Booking with ${attendeeName}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "America/New_York", // You may want to make this configurable
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "America/New_York",
    },
    // Note: Service accounts can't add external attendees without Domain-Wide Delegation
    // Attendee info is included in the description instead
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },      // 10 minutes before
      ],
    },
  };

  // Try to create event with Google Meet, fall back to no Meet if not supported
  let response;
  try {
    response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        ...event,
        conferenceData: {
          createRequest: {
            requestId: `booking-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
      conferenceDataVersion: 1,
    });
    console.log("Event created with Meet:", response.data.conferenceData);
  } catch (meetError) {
    // If Meet creation fails, create event without conference
    console.log("Google Meet creation failed:", meetError.message);
    console.log("Full error:", JSON.stringify(meetError.response?.data || meetError, null, 2));
    response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });
  }

  return {
    eventId: response.data.id,
    htmlLink: response.data.htmlLink,
    meetLink: response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri || null,
  };
}
