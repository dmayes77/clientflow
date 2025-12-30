"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SERVICES_KEY = ["services"];

async function fetchServices(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params.active !== undefined) searchParams.set("active", params.active);

  const res = await fetch(`/api/services?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch services");
  return res.json();
}

async function fetchService(id) {
  const res = await fetch(`/api/services/${id}`);
  if (!res.ok) throw new Error("Failed to fetch service");
  return res.json();
}

async function createService(data) {
  const res = await fetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create service");
  }
  return res.json();
}

async function updateService({ id, ...data }) {
  const res = await fetch(`/api/services/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update service");
  }
  return res.json();
}

async function deleteService(id) {
  const res = await fetch(`/api/services/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete service");
  }
  return res.json();
}

async function reorderServices(updates) {
  const res = await fetch("/api/services/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to reorder services");
  }
  return res.json();
}

export function useServices(params = {}) {
  return useQuery({
    queryKey: [...SERVICES_KEY, params],
    queryFn: () => fetchServices(params),
  });
}

export function useService(id) {
  return useQuery({
    queryKey: [...SERVICES_KEY, id],
    queryFn: () => fetchService(id),
    enabled: !!id,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateService,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
      queryClient.setQueryData([...SERVICES_KEY, variables.id], data);
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}

export function useReorderServices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderServices,
    onMutate: async (updates) => {
      // Cancel all service queries
      await queryClient.cancelQueries({ queryKey: SERVICES_KEY });

      // Get snapshot for rollback
      const previousData = queryClient.getQueriesData({ queryKey: SERVICES_KEY });

      // Get all current service queries and update them
      const updatesMap = new Map(updates.map(u => [u.id, u.displayOrder]));

      // Update all matching query data
      queryClient.setQueriesData(
        { queryKey: SERVICES_KEY },
        (old) => {
          if (!old) return old;

          // Update displayOrder for affected services
          return old.map(service =>
            updatesMap.has(service.id)
              ? { ...service, displayOrder: updatesMap.get(service.id) }
              : service
          );
        }
      );

      return { previousData };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: SERVICES_KEY });
    },
  });
}
