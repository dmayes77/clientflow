"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CUSTOM_FIELDS_KEY = ["custom-fields"];

async function fetchCustomFields(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.activeOnly) searchParams.set("activeOnly", "true");

  const res = await fetch(`/api/custom-fields?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch custom fields");
  return res.json();
}

async function fetchCustomField(id) {
  const res = await fetch(`/api/custom-fields/${id}`);
  if (!res.ok) throw new Error("Failed to fetch custom field");
  return res.json();
}

async function createCustomField(data) {
  const res = await fetch("/api/custom-fields", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create custom field");
  }
  return res.json();
}

async function updateCustomField({ id, ...data }) {
  const res = await fetch(`/api/custom-fields/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update custom field");
  }
  return res.json();
}

async function deleteCustomField(id) {
  const res = await fetch(`/api/custom-fields/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete custom field");
  }
  return res.json();
}

async function fetchContactCustomFields(contactId) {
  const res = await fetch(`/api/contacts/${contactId}/custom-fields`);
  if (!res.ok) throw new Error("Failed to fetch contact custom fields");
  return res.json();
}

async function setContactCustomFields({ contactId, values }) {
  const res = await fetch(`/api/contacts/${contactId}/custom-fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to set contact custom fields");
  }
  return res.json();
}

export function useCustomFields(params = {}) {
  return useQuery({
    queryKey: [...CUSTOM_FIELDS_KEY, params],
    queryFn: () => fetchCustomFields(params),
  });
}

export function useCustomField(id) {
  return useQuery({
    queryKey: [...CUSTOM_FIELDS_KEY, id],
    queryFn: () => fetchCustomField(id),
    enabled: !!id,
  });
}

export function useCreateCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS_KEY });
    },
  });
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCustomField,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS_KEY });
      queryClient.setQueryData([...CUSTOM_FIELDS_KEY, variables.id], data);
    },
  });
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_FIELDS_KEY });
    },
  });
}

export function useContactCustomFields(contactId) {
  return useQuery({
    queryKey: ["contacts", contactId, "custom-fields"],
    queryFn: () => fetchContactCustomFields(contactId),
    enabled: !!contactId,
  });
}

export function useSetContactCustomFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setContactCustomFields,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contacts", variables.contactId, "custom-fields"],
      });
    },
  });
}
