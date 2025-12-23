"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AVAILABILITY_KEY = ["availability"];
const BLOCKED_DATES_KEY = ["blocked-dates"];

async function fetchAvailability() {
  const res = await fetch("/api/availability");
  if (!res.ok) throw new Error("Failed to fetch availability");
  return res.json();
}

async function updateAvailability(data) {
  const res = await fetch("/api/availability", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update availability");
  }
  return res.json();
}

async function fetchBlockedDates() {
  const res = await fetch("/api/availability/overrides");
  if (!res.ok) throw new Error("Failed to fetch blocked dates");
  return res.json();
}

async function createBlockedDate(data) {
  const res = await fetch("/api/availability/overrides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create blocked date");
  }
  return res.json();
}

async function deleteBlockedDate(id) {
  const res = await fetch(`/api/availability/overrides/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete blocked date");
  }
  return res.json();
}

export function useAvailability() {
  return useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: fetchAvailability,
  });
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AVAILABILITY_KEY });
    },
  });
}

export function useBlockedDates() {
  return useQuery({
    queryKey: BLOCKED_DATES_KEY,
    queryFn: fetchBlockedDates,
  });
}

export function useCreateBlockedDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBlockedDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_KEY });
    },
  });
}

export function useDeleteBlockedDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBlockedDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKED_DATES_KEY });
    },
  });
}
