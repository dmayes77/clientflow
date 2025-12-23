"use client";

import { useMutation } from "@tanstack/react-query";

async function checkSlugAvailability(slug) {
  const res = await fetch("/api/signup/check-slug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to check slug availability");
  }

  return res.json();
}

async function createCheckoutSession(data) {
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

async function verifyCheckoutSession(sessionId) {
  const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Payment verification failed");
  }

  return res.json();
}

async function activateFounderCode(code) {
  const res = await fetch("/api/founders/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Activation failed");
  }

  return res.json();
}

export function useCheckSlug() {
  return useMutation({
    mutationFn: checkSlugAvailability,
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: createCheckoutSession,
  });
}

export function useVerifyCheckoutSession() {
  return useMutation({
    mutationFn: verifyCheckoutSession,
  });
}

export function useActivateFounderCode() {
  return useMutation({
    mutationFn: activateFounderCode,
  });
}
