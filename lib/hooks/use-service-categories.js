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

async function updateServiceCategory({ id, ...data }) {
  const res = await fetch(`/api/service-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update service category");
  }
  return res.json();
}

async function deleteServiceCategory(id) {
  const res = await fetch(`/api/service-categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || error.details || "Failed to delete service category");
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

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateServiceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteServiceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
    },
  });
}

export function useReorderServiceCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderServiceCategories,
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: SERVICE_CATEGORIES_KEY });

      // Snapshot the previous value
      const previousCategories = queryClient.getQueryData(SERVICE_CATEGORIES_KEY);

      // Optimistically update to the new value
      queryClient.setQueryData(SERVICE_CATEGORIES_KEY, (old) => {
        if (!old) return old;

        // Create a map of updates for quick lookup
        const updatesMap = new Map(updates.map(u => [u.id, u.displayOrder]));

        // Update displayOrder for affected categories
        return old.map(category =>
          updatesMap.has(category.id)
            ? { ...category, displayOrder: updatesMap.get(category.id) }
            : category
        ).sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
      });

      return { previousCategories };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(SERVICE_CATEGORIES_KEY, context.previousCategories);
      }
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: SERVICE_CATEGORIES_KEY });
    },
  });
}
