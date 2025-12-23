"use client";

import { useQuery } from "@tanstack/react-query";

const PLANS_KEY = ["plans"];

async function fetchPlans() {
  const res = await fetch("/api/plans");
  if (!res.ok) throw new Error("Failed to fetch plans");
  const data = await res.json();
  return data.plans || [];
}

export function usePlans() {
  return useQuery({
    queryKey: PLANS_KEY,
    queryFn: fetchPlans,
  });
}
