"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TERMINAL_LOCATION_KEY = ["terminal", "location"];
const TERMINAL_READERS_KEY = ["terminal", "readers"];

async function fetchTerminalLocation() {
  const res = await fetch("/api/stripe/terminal/location");
  if (!res.ok) throw new Error("Failed to fetch terminal location");
  return res.json();
}

async function createTerminalLocation(data = {}) {
  const res = await fetch("/api/stripe/terminal/location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create location");
  }
  return res.json();
}

async function fetchTerminalReaders() {
  const res = await fetch("/api/stripe/terminal/readers");
  if (!res.ok) throw new Error("Failed to fetch terminal readers");
  return res.json();
}

async function createTerminalReader(data) {
  const res = await fetch("/api/stripe/terminal/readers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to register reader");
  }
  return res.json();
}

async function deleteTerminalReader(readerId) {
  const res = await fetch(`/api/stripe/terminal/readers/${readerId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove reader");
  }
  return res.json();
}

export function useTerminalLocation() {
  return useQuery({
    queryKey: TERMINAL_LOCATION_KEY,
    queryFn: fetchTerminalLocation,
  });
}

export function useCreateTerminalLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTerminalLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TERMINAL_LOCATION_KEY });
    },
  });
}

export function useTerminalReaders() {
  return useQuery({
    queryKey: TERMINAL_READERS_KEY,
    queryFn: fetchTerminalReaders,
  });
}

export function useCreateTerminalReader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTerminalReader,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TERMINAL_READERS_KEY });
    },
  });
}

export function useDeleteTerminalReader() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTerminalReader,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TERMINAL_READERS_KEY });
    },
  });
}
