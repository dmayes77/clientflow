"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ADMIN_STATS_KEY = ["admin", "stats"];
const ADMIN_TENANTS_KEY = ["admin", "tenants"];
const ADMIN_CONTENT_KEY = ["admin", "content"];
const ADMIN_SUBSCRIPTIONS_KEY = ["admin", "subscriptions"];
const ADMIN_ANALYTICS_KEY = ["admin", "analytics"];

// Stats
async function fetchAdminStats() {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}

// Tenants
async function fetchAdminTenants(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);

  const res = await fetch(`/api/admin/tenants?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch tenants");
  return res.json();
}

async function impersonateTenant(tenantId) {
  const res = await fetch("/api/admin/impersonate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to impersonate tenant");
  }
  return res.json();
}

// Content (roadmap/changelog)
async function fetchAdminContent(type) {
  const res = await fetch(`/api/admin/content/${type}`);
  if (!res.ok) throw new Error(`Failed to fetch ${type} content`);
  return res.json();
}

async function updateAdminContent({ type, content }) {
  const res = await fetch(`/api/admin/content/${type}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `Failed to update ${type} content`);
  }
  return res.json();
}

// Subscriptions
async function fetchAdminSubscriptions(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.plan) searchParams.set("plan", params.plan);
  if (params.status) searchParams.set("status", params.status);

  const res = await fetch(`/api/admin/subscriptions?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch subscriptions");
  return res.json();
}

// Analytics
async function fetchAdminAnalytics() {
  const res = await fetch("/api/admin/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

// Settings
async function fetchAdminSettings() {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function updateAdminSettings(data) {
  const res = await fetch("/api/admin/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update settings");
  }
  return res.json();
}

// Hooks
export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_STATS_KEY,
    queryFn: fetchAdminStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdminTenants(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_TENANTS_KEY, params],
    queryFn: () => fetchAdminTenants(params),
  });
}

export function useImpersonateTenant() {
  return useMutation({
    mutationFn: impersonateTenant,
  });
}

export function useAdminContent(type) {
  return useQuery({
    queryKey: [...ADMIN_CONTENT_KEY, type],
    queryFn: () => fetchAdminContent(type),
    enabled: !!type,
  });
}

export function useUpdateAdminContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminContent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_CONTENT_KEY, variables.type] });
    },
  });
}

export function useAdminSubscriptions(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_SUBSCRIPTIONS_KEY, params],
    queryFn: () => fetchAdminSubscriptions(params),
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ADMIN_ANALYTICS_KEY,
    queryFn: fetchAdminAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchAdminSettings,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}
