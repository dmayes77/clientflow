"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BOOKINGS_KEY = ["bookings"];

async function fetchBookings(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.contactId) searchParams.set("contactId", params.contactId);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);

  const res = await fetch(`/api/bookings?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

async function fetchBooking(id) {
  const res = await fetch(`/api/bookings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch booking");
  return res.json();
}

async function createBooking(data) {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create booking");
  }
  return res.json();
}

async function updateBooking({ id, ...data }) {
  const res = await fetch(`/api/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update booking");
  }
  return res.json();
}

async function deleteBooking(id) {
  const res = await fetch(`/api/bookings/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete booking");
  }
  return res.json();
}

export function useBookings(params = {}) {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, params],
    queryFn: () => fetchBookings(params),
  });
}

export function useBooking(id) {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, id],
    queryFn: () => fetchBooking(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBooking,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.setQueryData([...BOOKINGS_KEY, variables.id], data);
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
