"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ALERTS_KEY = ["alerts"];
const ADMIN_ALERTS_KEY = ["admin-alerts"];
const ADMIN_ALERT_RULES_KEY = ["admin-alert-rules"];
const ADMIN_ALERT_OPTIONS_KEY = ["admin-alert-options"];

async function fetchAlerts(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", params.limit);

  const res = await fetch(`/api/alerts?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

async function updateAlert({ alertId, action }) {
  const res = await fetch("/api/alerts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId, action }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update alert");
  }
  return res.json();
}

// Admin alert operations
async function fetchAdminAlerts(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.type && params.type !== "all") searchParams.set("type", params.type);

  const res = await fetch(`/api/admin/alerts?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch admin alerts");
  return res.json();
}

async function createAdminAlert(data) {
  const res = await fetch("/api/admin/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create alert");
  }
  return res.json();
}

async function dismissAdminAlert(alertId) {
  const res = await fetch("/api/admin/alerts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alertId, dismissed: true }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to dismiss alert");
  }
  return res.json();
}

async function fetchAlertRules() {
  const res = await fetch("/api/admin/alert-rules");
  if (!res.ok) throw new Error("Failed to fetch alert rules");
  return res.json();
}

async function fetchAlertOptions() {
  const res = await fetch("/api/admin/alert-rules?action=options");
  if (!res.ok) throw new Error("Failed to fetch alert options");
  return res.json();
}

async function saveAlertRule(data) {
  const res = await fetch("/api/admin/alert-rules", {
    method: data.id ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to save rule");
  }
  return res.json();
}

async function toggleAlertRule({ id, active }) {
  const res = await fetch("/api/admin/alert-rules", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, active }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to toggle rule");
  }
  return res.json();
}

async function deleteAlertRule(id) {
  const res = await fetch(`/api/admin/alert-rules?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete rule");
  return res.json();
}

async function seedDefaultRules() {
  const res = await fetch("/api/admin/alert-rules?action=seed");
  if (!res.ok) throw new Error("Failed to seed defaults");
  return res.json();
}

async function runAlertCron() {
  const res = await fetch("/api/cron/alerts");
  if (!res.ok) throw new Error("Failed to run cron");
  return res.json();
}

export function useAlerts(params = {}) {
  return useQuery({
    queryKey: [...ALERTS_KEY, params],
    queryFn: () => fetchAlerts(params),
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
    },
  });
}

// Admin hooks
export function useAdminAlerts(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_ALERTS_KEY, params],
    queryFn: () => fetchAdminAlerts(params),
  });
}

export function useCreateAdminAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ALERTS_KEY });
    },
  });
}

export function useDismissAdminAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dismissAdminAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ALERTS_KEY });
    },
  });
}

export function useAlertRules(options = {}) {
  return useQuery({
    queryKey: ADMIN_ALERT_RULES_KEY,
    queryFn: fetchAlertRules,
    ...options,
  });
}

export function useAlertOptions(options = {}) {
  return useQuery({
    queryKey: ADMIN_ALERT_OPTIONS_KEY,
    queryFn: fetchAlertOptions,
    ...options,
  });
}

export function useSaveAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAlertRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ALERT_RULES_KEY });
    },
  });
}

export function useToggleAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleAlertRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ALERT_RULES_KEY });
    },
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlertRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ALERT_RULES_KEY });
    },
  });
}

export function useSeedDefaultRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedDefaultRules,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ALERT_RULES_KEY });
    },
  });
}

export function useRunAlertCron() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runAlertCron,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ALERTS_KEY });
    },
  });
}
