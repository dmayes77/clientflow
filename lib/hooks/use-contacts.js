"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CONTACTS_KEY = ["contacts"];

async function fetchContacts(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.tag) searchParams.set("tag", params.tag);
  if (params.status) searchParams.set("status", params.status);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.offset) searchParams.set("offset", params.offset);
  if (params.includeArchived) searchParams.set("includeArchived", "true");
  if (params.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params.minBookings) searchParams.set("minBookings", params.minBookings);
  if (params.maxBookings) searchParams.set("maxBookings", params.maxBookings);

  const res = await fetch(`/api/contacts?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch contacts");
  return res.json();
}

async function fetchContact(id) {
  const res = await fetch(`/api/contacts/${id}`);
  if (!res.ok) throw new Error("Failed to fetch contact");
  return res.json();
}

async function fetchContactActivity(id) {
  const res = await fetch(`/api/contacts/${id}/activity`);
  if (!res.ok) throw new Error("Failed to fetch contact activity");
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

async function addContactTag({ contactId, tagId }) {
  const res = await fetch(`/api/contacts/${contactId}/tags`, {
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

async function removeContactTag({ contactId, tagId }) {
  const res = await fetch(`/api/contacts/${contactId}/tags?tagId=${tagId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove tag");
  }
  return res.json();
}

async function archiveContact(id) {
  const res = await fetch(`/api/contacts/${id}/archive`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to archive contact");
  }
  return res.json();
}

async function unarchiveContact(id) {
  const res = await fetch(`/api/contacts/${id}/archive`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to unarchive contact");
  }
  return res.json();
}

async function importContacts(data) {
  const res = await fetch("/api/contacts/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to import contacts");
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

export function useContactActivity(id) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, id, "activity"],
    queryFn: () => fetchContactActivity(id),
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

export function useAddContactTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addContactTag,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...CONTACTS_KEY, variables.contactId] });
    },
  });
}

export function useRemoveContactTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeContactTag,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...CONTACTS_KEY, variables.contactId] });
    },
  });
}

export function useArchiveContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}

export function useUnarchiveContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unarchiveContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}

export function useImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importContacts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}
