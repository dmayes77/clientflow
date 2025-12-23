"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ONBOARDING_KEY = ["onboarding", "progress"];

async function fetchOnboardingProgress() {
  const res = await fetch("/api/onboarding/progress");
  if (!res.ok) throw new Error("Failed to fetch onboarding progress");
  return res.json();
}

async function updateOnboardingProgress(data) {
  const res = await fetch("/api/onboarding/progress", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update onboarding progress");
  }
  return res.json();
}

export function useOnboardingProgress() {
  return useQuery({
    queryKey: ONBOARDING_KEY,
    queryFn: fetchOnboardingProgress,
  });
}

export function useUpdateOnboardingProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateOnboardingProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_KEY });
    },
  });
}
