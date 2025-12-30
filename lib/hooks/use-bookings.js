"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BOOKINGS_KEY = ["bookings"];

async function fetchBookings(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.contactId) searchParams.set("contactId", params.contactId);
  // Support both from/to and startDate/endDate parameter names
  if (params.startDate || params.from) searchParams.set("startDate", params.startDate || params.from);
  if (params.endDate || params.to) searchParams.set("endDate", params.endDate || params.to);
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

// Booking tags
async function addBookingTag({ bookingId, tagId }) {
  const res = await fetch(`/api/bookings/${bookingId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add tag");
  }
  return res.json();
}

async function removeBookingTag({ bookingId, tagId }) {
  const res = await fetch(`/api/bookings/${bookingId}/tags?tagId=${tagId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove tag");
  }
  return res.json();
}

// Booking services
async function addBookingService({ bookingId, serviceId }) {
  const res = await fetch(`/api/bookings/${bookingId}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add service");
  }
  return res.json();
}

async function removeBookingService({ bookingId, serviceId }) {
  const res = await fetch(`/api/bookings/${bookingId}/services?serviceId=${serviceId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove service");
  }
  return res.json();
}

// Booking packages
async function addBookingPackage({ bookingId, packageId }) {
  const res = await fetch(`/api/bookings/${bookingId}/packages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add package");
  }
  return res.json();
}

async function removeBookingPackage({ bookingId, packageId }) {
  const res = await fetch(`/api/bookings/${bookingId}/packages?packageId=${packageId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove package");
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

// Tag mutations
export function useAddBookingTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addBookingTag,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId] });
    },
  });
}

export function useRemoveBookingTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeBookingTag,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId] });
    },
  });
}

// Service mutations
export function useAddBookingService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addBookingService,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId] });
    },
  });
}

export function useRemoveBookingService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeBookingService,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId] });
    },
  });
}

// Package mutations
export function useAddBookingPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addBookingPackage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId] });
    },
  });
}

export function useRemoveBookingPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeBookingPackage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId] });
    },
  });
}

// Balance payment functions
async function fetchBookingBalanceInfo(bookingId) {
  const res = await fetch(`/api/bookings/${bookingId}/pay-balance`);
  if (!res.ok) throw new Error("Failed to fetch booking balance info");
  return res.json();
}

async function payBookingBalance({ bookingId, amount, paymentId }) {
  const res = await fetch(`/api/bookings/${bookingId}/pay-balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, paymentId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to record balance payment");
  }
  return res.json();
}

// Hook to get balance info for a booking
export function useBookingBalanceInfo(bookingId) {
  return useQuery({
    queryKey: [...BOOKINGS_KEY, bookingId, "balance"],
    queryFn: () => fetchBookingBalanceInfo(bookingId),
    enabled: !!bookingId,
  });
}

// Hook to record a balance payment for a booking
export function usePayBookingBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payBookingBalance,
    onSuccess: (_, variables) => {
      // Invalidate booking queries
      queryClient.invalidateQueries({ queryKey: BOOKINGS_KEY });
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: [...BOOKINGS_KEY, variables.bookingId, "balance"] });
      // Invalidate invoice queries (balance may have changed)
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      // Invalidate payment queries
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
