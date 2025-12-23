"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ADMIN_PLANS_KEY = ["admin-plans"];
const STRIPE_PRODUCTS_KEY = ["admin", "stripe-products"];

// Fetch all plans
async function fetchPlans() {
  const res = await fetch("/api/admin/plans");
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
}

// Fetch Stripe products for sync
async function fetchStripeProducts() {
  const res = await fetch("/api/admin/plans/sync");
  if (!res.ok) throw new Error("Failed to fetch Stripe products");
  return res.json();
}

// Create/update plan
async function savePlan({ id, ...data }) {
  const res = await fetch("/api/admin/plans", {
    method: id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(id ? { id, ...data } : data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to save plan");
  }
  return res.json();
}

// Delete plan
async function deletePlan(id) {
  const res = await fetch(`/api/admin/plans?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete plan");
  }
  return res.json();
}

// Toggle plan active status
async function togglePlanActive({ id, active }) {
  const res = await fetch("/api/admin/plans", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, active }),
  });
  if (!res.ok) throw new Error("Failed to update plan");
  return res.json();
}

// Reorder plans
async function reorderPlans(planIds) {
  const res = await fetch("/api/admin/plans/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder plans");
  return res.json();
}

// Sync products from Stripe
async function syncStripeProducts({ productIds, updateExisting }) {
  const res = await fetch("/api/admin/plans/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds, updateExisting }),
  });
  if (!res.ok) throw new Error("Failed to sync products");
  return res.json();
}

// Hooks
export function useAdminPlans() {
  return useQuery({
    queryKey: ADMIN_PLANS_KEY,
    queryFn: fetchPlans,
  });
}

export function useStripeProducts(enabled = false) {
  return useQuery({
    queryKey: STRIPE_PRODUCTS_KEY,
    queryFn: fetchStripeProducts,
    enabled,
    staleTime: 0, // Always refetch when dialog opens
  });
}

export function useSavePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY });
    },
  });
}

export function useTogglePlanActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: togglePlanActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY });
    },
  });
}

export function useReorderPlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderPlans,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY });
    },
  });
}

export function useSyncStripeProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncStripeProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_KEY });
      queryClient.invalidateQueries({ queryKey: STRIPE_PRODUCTS_KEY });
    },
  });
}
