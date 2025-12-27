"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const EMAIL_TEMPLATES_KEY = ["email-templates"];

async function fetchEmailTemplates() {
  const res = await fetch("/api/email-templates");
  if (!res.ok) throw new Error("Failed to fetch email templates");
  return res.json();
}

async function fetchEmailTemplate(id) {
  const res = await fetch(`/api/email-templates/${id}`);
  if (!res.ok) throw new Error("Failed to fetch email template");
  return res.json();
}

async function createEmailTemplate(data) {
  const res = await fetch("/api/email-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create email template");
  }
  return res.json();
}

async function updateEmailTemplate({ id, ...data }) {
  const res = await fetch(`/api/email-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update email template");
  }
  return res.json();
}

async function deleteEmailTemplate(id) {
  const res = await fetch(`/api/email-templates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete email template");
  }
  return res.json();
}

async function seedEmailTemplates() {
  const res = await fetch("/api/email-templates/seed", {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to seed email templates");
  }
  return res.json();
}

async function sendTestEmail({ id, recipientEmail, sampleData }) {
  const res = await fetch(`/api/email-templates/${id}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientEmail, sampleData }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to send test email");
  }
  return res.json();
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: EMAIL_TEMPLATES_KEY,
    queryFn: fetchEmailTemplates,
  });
}

export function useEmailTemplate(id) {
  return useQuery({
    queryKey: [...EMAIL_TEMPLATES_KEY, id],
    queryFn: () => fetchEmailTemplate(id),
    enabled: !!id,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATES_KEY });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEmailTemplate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATES_KEY });
      queryClient.setQueryData([...EMAIL_TEMPLATES_KEY, variables.id], data);
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATES_KEY });
    },
  });
}

export function useSeedEmailTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedEmailTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAIL_TEMPLATES_KEY });
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: sendTestEmail,
  });
}
