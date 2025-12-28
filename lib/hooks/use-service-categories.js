"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SERVICE_CATEGORIES_KEY = ["service-categories"];

async function fetchServiceCategories() {
  const res = await fetch("/api/service-categories");
  if (!res.ok) throw new Error("Failed to fetch service categories");
  return res.json();
}

async function createServiceCategory(data) {
  const res = await fetch("/api/service-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create service category");
  }
  return res.json();
}

async function reorderServiceCategories(updates) {
  const res = await fetch("/api/service-categories/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to reorder categories");
  }
  return res.json();
}

export function useServiceCategories() {
  return useQuery({
    queryKey: SERVICE_CATEGORIES_KEY,
    queryFn: fetchServiceCategories,
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createServiceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
    },
  });
}

export function useReorderServiceCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderServiceCategories,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
    },
  });
}
