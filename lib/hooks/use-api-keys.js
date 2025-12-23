"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_KEYS_KEY = ["api-keys"];

async function fetchApiKeys() {
  const res = await fetch("/api/api-keys");
  if (!res.ok) throw new Error("Failed to fetch API keys");
  return res.json();
}

async function createApiKey(data) {
  const res = await fetch("/api/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create API key");
  }
  return res.json();
}

async function deleteApiKey(id) {
  const res = await fetch(`/api/api-keys?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete API key");
  }
  return res.json();
}

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_KEY,
    queryFn: fetchApiKeys,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}
