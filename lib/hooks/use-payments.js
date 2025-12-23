"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PAYMENTS_KEY = ["payments"];

async function fetchPayments(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.search) searchParams.set("search", params.search);
  if (params.contactId) searchParams.set("contactId", params.contactId);
  if (params.invoiceId) searchParams.set("invoiceId", params.invoiceId);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);

  const res = await fetch(`/api/payments?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
}

async function fetchPayment(id) {
  const res = await fetch(`/api/payments/${id}`);
  if (!res.ok) throw new Error("Failed to fetch payment");
  return res.json();
}

async function createPayment(data) {
  const res = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create payment");
  }
  return res.json();
}

async function refundPayment({ id, amount, reason }) {
  const res = await fetch(`/api/payments/${id}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, reason }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to refund payment");
  }
  return res.json();
}

export function usePayments(params = {}) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, params],
    queryFn: () => fetchPayments(params),
  });
}

export function usePayment(id) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, id],
    queryFn: () => fetchPayment(id),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refundPayment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
