"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const TENANT_KEY = ["tenant"];

async function fetchTenant() {
  const res = await fetch("/api/tenant");
  if (!res.ok) throw new Error("Failed to fetch tenant");
  return res.json();
}

async function fetchTenantStatus() {
  const res = await fetch("/api/tenant/status");
  if (!res.ok) throw new Error("Failed to fetch tenant status");
  return res.json();
}

async function updateTenant(data) {
  const res = await fetch("/api/tenant", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update tenant");
  }
  return res.json();
}

async function updateBusinessSettings(data) {
  const res = await fetch("/api/tenant/business", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update business settings");
  }
  return res.json();
}

async function updatePaymentSettings(data) {
  const res = await fetch("/api/tenant/payment-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update payment settings");
  }
  return res.json();
}

export function useTenant() {
  return useQuery({
    queryKey: TENANT_KEY,
    queryFn: fetchTenant,
  });
}

export function useTenantStatus() {
  return useQuery({
    queryKey: [...TENANT_KEY, "status"],
    queryFn: fetchTenantStatus,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_KEY });
    },
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_KEY });
    },
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePaymentSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_KEY });
    },
  });
}
