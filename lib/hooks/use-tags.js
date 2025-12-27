"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TAGS_KEY = ["tags"];

async function fetchTags(type = "all") {
  const url = type === "all" ? "/api/tags" : `/api/tags?type=${type}`;
  const res = await fetch(url);
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
    method: "PUT",
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

async function mergeTags({ sourceTagId, targetTagId }) {
  const res = await fetch("/api/tags/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceTagId, targetTagId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to merge tags");
  }
  return res.json();
}

async function bulkTagOperation({ operation, tagId, entityType, entityIds }) {
  const res = await fetch("/api/tags/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, tagId, entityType, entityIds }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to perform bulk operation");
  }
  return res.json();
}

async function importTags(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/tags/import", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to import tags");
  }
  return res.json();
}

async function exportTags() {
  const res = await fetch("/api/tags/export");
  if (!res.ok) {
    throw new Error("Failed to export tags");
  }
  const blob = await res.blob();
  return blob;
}

export function useTags(type = "all") {
  return useQuery({
    queryKey: [...TAGS_KEY, type],
    queryFn: () => fetchTags(type),
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

export function useMergeTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mergeTags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useBulkTagOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkTagOperation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useImportTags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importTags,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
}

export function useExportTags() {
  return useMutation({
    mutationFn: exportTags,
  });
}
