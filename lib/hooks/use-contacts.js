"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CONTACTS_KEY = ["contacts"];

async function fetchContacts(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.tag) searchParams.set("tag", params.tag);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);

  const res = await fetch(`/api/contacts?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

async function fetchContact(id) {
  const res = await fetch(`/api/contacts/${id}`);
  if (!res.ok) throw new Error("Failed to fetch contact");
  return res.json();
}

async function createContact(data) {
  const res = await fetch("/api/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create contact");
  }
  return res.json();
}

async function updateContact({ id, ...data }) {
  const res = await fetch(`/api/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update contact");
  }
  return res.json();
}

async function deleteContact(id) {
  const res = await fetch(`/api/contacts/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete contact");
  }
  return res.json();
}

export function useContacts(params = {}) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, params],
    queryFn: () => fetchContacts(params),
  });
}

export function useContact(id) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, id],
    queryFn: () => fetchContact(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateContact,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      queryClient.setQueryData([...CONTACTS_KEY, variables.id], data);
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}
