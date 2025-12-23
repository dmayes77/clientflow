"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const WEBHOOKS_KEY = ["webhooks"];

async function fetchWebhooks() {
  const res = await fetch("/api/webhooks");
  if (!res.ok) throw new Error("Failed to fetch webhooks");
  return res.json();
}

async function fetchWebhook(id) {
  const res = await fetch(`/api/webhooks/${id}`);
  if (!res.ok) throw new Error("Failed to fetch webhook");
  return res.json();
}

async function createWebhook(data) {
  const res = await fetch("/api/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create webhook");
  }
  return res.json();
}

async function updateWebhook({ id, ...data }) {
  const res = await fetch(`/api/webhooks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update webhook");
  }
  return res.json();
}

async function deleteWebhook(id) {
  const res = await fetch(`/api/webhooks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete webhook");
  }
  return res.json();
}

export function useWebhooks() {
  return useQuery({
    queryKey: WEBHOOKS_KEY,
    queryFn: fetchWebhooks,
  });
}

export function useWebhook(id) {
  return useQuery({
    queryKey: [...WEBHOOKS_KEY, id],
    queryFn: () => fetchWebhook(id),
    enabled: !!id,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOKS_KEY });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWebhook,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOKS_KEY });
      queryClient.setQueryData([...WEBHOOKS_KEY, variables.id], data);
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOKS_KEY });
    },
  });
}
