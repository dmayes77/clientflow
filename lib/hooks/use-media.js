"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const IMAGES_KEY = ["images"];
const VIDEOS_KEY = ["videos"];

// Images
async function fetchImages(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.folder) searchParams.set("folder", params.folder);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);

  const res = await fetch(`/api/images?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch images");
  return res.json();
}

async function uploadImage(formData) {
  const res = await fetch("/api/images", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to upload image");
  }
  return res.json();
}

async function updateImage({ id, ...data }) {
  const res = await fetch(`/api/images/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update image");
  }
  return res.json();
}

async function deleteImage(id) {
  const res = await fetch(`/api/images/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete image");
  }
  return res.json();
}

// Videos
async function fetchVideos(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.folder) searchParams.set("folder", params.folder);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);

  const res = await fetch(`/api/videos?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}

async function uploadVideo(formData) {
  const res = await fetch("/api/videos", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to upload video");
  }
  return res.json();
}

async function updateVideo({ id, ...data }) {
  const res = await fetch(`/api/videos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update video");
  }
  return res.json();
}

async function deleteVideo(id) {
  const res = await fetch(`/api/videos/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete video");
  }
  return res.json();
}

// Image hooks
export function useImages(params = {}) {
  return useQuery({
    queryKey: [...IMAGES_KEY, params],
    queryFn: () => fetchImages(params),
  });
}

export function useUploadImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMAGES_KEY });
    },
  });
}

export function useUpdateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMAGES_KEY });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: IMAGES_KEY });
    },
  });
}

// Video hooks
export function useVideos(params = {}) {
  return useQuery({
    queryKey: [...VIDEOS_KEY, params],
    queryFn: () => fetchVideos(params),
  });
}

export function useUploadVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIDEOS_KEY });
    },
  });
}

export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIDEOS_KEY });
    },
  });
}

export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIDEOS_KEY });
    },
  });
}
