"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const COUPONS_KEY = ["coupons"];

async function fetchCoupons(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.active !== undefined) searchParams.set("active", params.active);

  const res = await fetch(`/api/coupons?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch coupons");
  return res.json();
}

async function fetchCoupon(id) {
  const res = await fetch(`/api/coupons/${id}`);
  if (!res.ok) throw new Error("Failed to fetch coupon");
  return res.json();
}

async function createCoupon(data) {
  const res = await fetch("/api/coupons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create coupon");
  }
  return res.json();
}

async function updateCoupon({ id, ...data }) {
  const res = await fetch(`/api/coupons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update coupon");
  }
  return res.json();
}

async function deleteCoupon(id) {
  const res = await fetch(`/api/coupons/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete coupon");
  }
  return res.json();
}

async function validateCoupon({ code, lineItems }) {
  const res = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, lineItems }),
  });
  if (!res.ok) throw new Error("Failed to validate coupon");
  return res.json();
}

export function useCoupons(params = {}) {
  return useQuery({
    queryKey: [...COUPONS_KEY, params],
    queryFn: () => fetchCoupons(params),
  });
}

export function useCoupon(id) {
  return useQuery({
    queryKey: [...COUPONS_KEY, id],
    queryFn: () => fetchCoupon(id),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPONS_KEY });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCoupon,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: COUPONS_KEY });
      queryClient.setQueryData([...COUPONS_KEY, variables.id], data);
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COUPONS_KEY });
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: validateCoupon,
  });
}
