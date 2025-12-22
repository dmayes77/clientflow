"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TAGS_KEY = ["tags"];

async function fetchTags() {
  const res = await fetch("/api/tags");
  if (!res.ok) throw new Error("Failed to fetch tags");
  return res.json();
}

async function createTag(data) {
  const res = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create tag");
  }
  return res.json();
}

async function updateTag({ id, ...data }) {
  const res = await fetch(`/api/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update tag");
  }
  return res.json();
}

async function deleteTag(id) {
  const res = await fetch(`/api/tags/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete tag");
  }
  return res.json();
}

export function useTags() {
  return useQuery({
    queryKey: TAGS_KEY,
    queryFn: fetchTags,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}
