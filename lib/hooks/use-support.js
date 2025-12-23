import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to fetch all support messages (admin)
 */
export function useSupportMessages(filters = {}) {
  const { status = "all", type = "all", limit = 50, offset = 0 } = filters;

  return useQuery({
    queryKey: ["support-messages", status, type, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (type !== "all") params.append("type", type);
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());

      const response = await fetch(`/api/support?${params}`);
      if (!response.ok) throw new Error("Failed to fetch support messages");
      return response.json();
    },
  });
}

/**
 * Hook to get unread message count
 */
export function useUnreadSupportCount() {
  return useQuery({
    queryKey: ["support-messages-unread-count"],
    queryFn: async () => {
      const response = await fetch("/api/support?status=unread&limit=1");
      if (!response.ok) throw new Error("Failed to fetch unread count");
      const data = await response.json();
      return data.unreadCount || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to create a support message
 */
export function useCreateSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    },
  });
}

/**
 * Hook to update support message status
 */
export function useUpdateSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, priority }) => {
      const response = await fetch(`/api/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority }),
      });

      if (!response.ok) throw new Error("Failed to update message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
      queryClient.invalidateQueries({ queryKey: ["support-messages-unread-count"] });
    },
  });
}

/**
 * Hook to delete support message
 */
export function useDeleteSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/support/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
      queryClient.invalidateQueries({ queryKey: ["support-messages-unread-count"] });
    },
  });
}
