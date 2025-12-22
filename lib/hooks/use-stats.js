"use client";

import { useQuery } from "@tanstack/react-query";

const STATS_KEY = ["stats"];

async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export function useStats() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
