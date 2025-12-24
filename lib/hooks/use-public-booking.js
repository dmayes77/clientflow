"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PUBLIC_BUSINESS_KEY = ["public", "business"];
const PUBLIC_AVAILABILITY_KEY = ["public", "availability"];
const PUBLIC_BOOKING_KEY = ["public", "booking"];

// Fetch business data (services, packages, categories, availability)
async function fetchPublicBusiness(slug) {
  const res = await fetch(`/api/public/${slug}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch business");
  }
  return res.json();
}

// Fetch availability for a specific date
async function fetchAvailability({ slug, date, duration }) {
  const params = new URLSearchParams({
    date: date.toISOString(),
  });
  if (duration) params.set("duration", duration);

  const res = await fetch(`/api/public/${slug}/availability?${params}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch availability");
  }
  return res.json();
}

// Create a booking
async function createBooking({ slug, ...bookingData }) {
  const res = await fetch(`/api/public/${slug}/book`, {
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

// Create checkout session
async function createCheckout({ slug, ...checkoutData }) {
  const res = await fetch(`/api/public/${slug}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(checkoutData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create checkout");
  }
  return res.json();
}

// Verify payment
async function verifyPayment({ slug, sessionId }) {
  const res = await fetch(`/api/public/${slug}/verify-payment?session_id=${sessionId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to verify payment");
  }
  return res.json();
}

// Fetch booking info
async function fetchBookingInfo({ slug, bookingId }) {
  const res = await fetch(`/api/public/${slug}/booking/${bookingId}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch booking");
  }
  return res.json();
}

// Hooks
export function usePublicBusiness(slug) {
  return useQuery({
    queryKey: [...PUBLIC_BUSINESS_KEY, slug],
    queryFn: () => fetchPublicBusiness(slug),
    enabled: !!slug && slug !== "undefined",
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function usePublicAvailability({ slug, date, duration, enabled = true }) {
  return useQuery({
    queryKey: [...PUBLIC_AVAILABILITY_KEY, slug, date?.toISOString(), duration],
    queryFn: () => fetchAvailability({ slug, date, duration }),
    enabled: enabled && !!slug && slug !== "undefined" && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreatePublicBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...PUBLIC_AVAILABILITY_KEY, variables.slug] });
    },
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: createCheckout,
  });
}

export function useVerifyPayment({ slug, sessionId }) {
  return useQuery({
    queryKey: [...PUBLIC_BOOKING_KEY, "verify", slug, sessionId],
    queryFn: () => verifyPayment({ slug, sessionId }),
    enabled: !!slug && slug !== "undefined" && !!sessionId,
    retry: 2,
  });
}

export function useBookingInfo({ slug, bookingId }) {
  return useQuery({
    queryKey: [...PUBLIC_BOOKING_KEY, slug, bookingId],
    queryFn: () => fetchBookingInfo({ slug, bookingId }),
    enabled: !!slug && slug !== "undefined" && !!bookingId,
    retry: 1,
  });
}
