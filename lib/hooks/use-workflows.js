"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const WORKFLOWS_KEY = ["workflows"];

async function fetchWorkflows() {
  const res = await fetch("/api/workflows");
  if (!res.ok) throw new Error("Failed to fetch workflows");
  return res.json();
}

async function fetchWorkflow(id) {
  const res = await fetch(`/api/workflows/${id}`);
  if (!res.ok) throw new Error("Failed to fetch workflow");
  return res.json();
}

async function createWorkflow(data) {
  const res = await fetch("/api/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create workflow");
  }
  return res.json();
}

async function updateWorkflow({ id, ...data }) {
  const res = await fetch(`/api/workflows/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update workflow");
  }
  return res.json();
}

async function deleteWorkflow(id) {
  const res = await fetch(`/api/workflows/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete workflow");
  }
  return res.json();
}

export function useWorkflows() {
  return useQuery({
    queryKey: WORKFLOWS_KEY,
    queryFn: fetchWorkflows,
  });
}

export function useWorkflow(id) {
  return useQuery({
    queryKey: [...WORKFLOWS_KEY, id],
    queryFn: () => fetchWorkflow(id),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_KEY });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkflow,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_KEY });
      queryClient.setQueryData([...WORKFLOWS_KEY, variables.id], data);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_KEY });
    },
  });
}
