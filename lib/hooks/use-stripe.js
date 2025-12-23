"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const STRIPE_ACCOUNT_KEY = ["stripe", "account"];

async function fetchStripeAccount() {
  const res = await fetch("/api/stripe/account");
  if (!res.ok) throw new Error("Failed to fetch Stripe account");
  return res.json();
}

async function connectStripe() {
  const res = await fetch("/api/stripe/connect/onboard", {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to start Stripe onboarding");
  }
  return res.json();
}

async function disconnectStripe() {
  const res = await fetch("/api/stripe/connect/disconnect", {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to disconnect Stripe");
  }
  return res.json();
}

async function createPortalSession() {
  const res = await fetch("/api/stripe/create-portal-session", {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create portal session");
  }
  return res.json();
}

async function createCheckout(data) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create checkout session");
  }
  return res.json();
}

async function createBillingPortal() {
  const res = await fetch("/api/stripe/billing-portal", {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create billing portal");
  }
  return res.json();
}

export function useStripeAccount() {
  return useQuery({
    queryKey: STRIPE_ACCOUNT_KEY,
    queryFn: fetchStripeAccount,
    retry: false,
  });
}

export function useConnectStripe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: connectStripe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRIPE_ACCOUNT_KEY });
    },
  });
}

export function useDisconnectStripe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disconnectStripe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRIPE_ACCOUNT_KEY });
    },
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: createPortalSession,
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: createCheckout,
  });
}

export function useCreateBillingPortal() {
  return useMutation({
    mutationFn: createBillingPortal,
  });
}
