"use client";

import { useQuery, useMutation } from "@tanstack/react-query";

const CALENDAR_AVAILABILITY_KEY = ["calendar", "availability"];
const CALENDAR_BOOKING_KEY = ["calendar", "booking"];

// Fetch calendar availability
async function fetchCalendarAvailability({ date, duration }) {
  const params = new URLSearchParams({
    date: date.toISOString(),
    duration: duration.toString(),
  });

  const res = await fetch(`/api/calendar/availability?${params}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch availability");
  }
  return res.json();
}

// Create calendar booking
async function createCalendarBooking(bookingData) {
  const res = await fetch("/api/calendar/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create booking");
  }
  return res.json();
}

// Hooks
export function useCalendarAvailability({ date, duration, enabled = true }) {
  return useQuery({
    queryKey: [...CALENDAR_AVAILABILITY_KEY, date?.toISOString(), duration],
    queryFn: () => fetchCalendarAvailability({ date, duration }),
    enabled: enabled && !!date && !!duration,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateCalendarBooking() {
  return useMutation({
    mutationFn: createCalendarBooking,
  });
}
