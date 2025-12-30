"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const INVOICES_KEY = ["invoices"];

async function fetchInvoices(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.contactId) searchParams.set("contactId", params.contactId);
  if (params.search) searchParams.set("search", params.search);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);

  const res = await fetch(`/api/invoices?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

async function exportInvoices(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const res = await fetch(`/api/invoices/export?${searchParams}`);
  if (!res.ok) throw new Error("Failed to export invoices");
  return res.blob();
}

async function fetchInvoice(id) {
  const res = await fetch(`/api/invoices/${id}`);
  if (!res.ok) throw new Error("Failed to fetch invoice");
  return res.json();
}

async function createInvoice(data) {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create invoice");
  }
  return res.json();
}

async function updateInvoice({ id, ...data }) {
  const res = await fetch(`/api/invoices/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update invoice");
  }
  return res.json();
}

async function deleteInvoice(id) {
  const res = await fetch(`/api/invoices/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete invoice");
  }
  return res.json();
}

async function sendInvoice(id) {
  const res = await fetch(`/api/invoices/${id}/send`, {
    method: "POST",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to send invoice");
  }
  return res.json();
}

async function downloadInvoicePDF({ id, invoiceNumber }) {
  const res = await fetch(`/api/invoices/${id}/pdf`);
  if (!res.ok) throw new Error("Failed to generate PDF");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  return { success: true };
}

async function addInvoiceTag({ invoiceId, tagId }) {
  const res = await fetch(`/api/invoices/${invoiceId}/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tagId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add tag");
  }
  return res.json();
}

async function removeInvoiceTag({ invoiceId, tagId }) {
  const res = await fetch(`/api/invoices/${invoiceId}/tags?tagId=${tagId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove tag");
  }
  return res.json();
}

export function useInvoices(params = {}) {
  return useQuery({
    queryKey: [...INVOICES_KEY, params],
    queryFn: () => fetchInvoices(params),
  });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: [...INVOICES_KEY, id],
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.setQueryData([...INVOICES_KEY, variables.id], data);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useSendInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendInvoice,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [...INVOICES_KEY, id] });
    },
  });
}

export function useDownloadInvoicePDF() {
  return useMutation({
    mutationFn: downloadInvoicePDF,
  });
}

export function useAddInvoiceTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addInvoiceTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useRemoveInvoiceTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeInvoiceTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
    },
  });
}

export function useExportInvoices() {
  return useMutation({
    mutationFn: exportInvoices,
  });
}
