"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PACKAGES_KEY = ["packages"];

async function fetchPackages(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.active !== undefined) searchParams.set("active", params.active);

  const res = await fetch(`/api/packages?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch packages");
  return res.json();
}

async function fetchPackage(id) {
  const res = await fetch(`/api/packages/${id}`);
  if (!res.ok) throw new Error("Failed to fetch package");
  return res.json();
}

async function createPackage(data) {
  const res = await fetch("/api/packages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create package");
  }
  return res.json();
}

async function updatePackage({ id, ...data }) {
  const res = await fetch(`/api/packages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update package");
  }
  return res.json();
}

async function deletePackage(id) {
  const res = await fetch(`/api/packages/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete package");
  }
  return res.json();
}

async function reorderPackages(updates) {
  const res = await fetch("/api/packages/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to reorder packages");
  }
  return res.json();
}

export function usePackages(params = {}) {
  return useQuery({
    queryKey: [...PACKAGES_KEY, params],
    queryFn: () => fetchPackages(params),
  });
}

export function usePackage(id) {
  return useQuery({
    queryKey: [...PACKAGES_KEY, id],
    queryFn: () => fetchPackage(id),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
    },
  });
}

export function useUpdatePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePackage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
      queryClient.setQueryData([...PACKAGES_KEY, variables.id], data);
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
    },
  });
}

export function useReorderPackages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderPackages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PACKAGES_KEY });
    },
  });
}
