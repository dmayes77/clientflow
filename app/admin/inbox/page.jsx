"use client";

import { useState } from "react";
import { useSupportMessages, useUpdateSupportMessage, useDeleteSupportMessage } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Inbox, Mail, MailOpen, Check, Trash2, AlertCircle, Bug, Lightbulb, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const TYPE_ICONS = {
  support: MessageSquare,
  bug: Bug,
  feature: Lightbulb,
  error: AlertCircle,
};

const TYPE_COLORS = {
  support: "bg-blue-100 text-blue-700",
  bug: "bg-red-100 text-red-700",
  feature: "bg-purple-100 text-purple-700",
  error: "bg-orange-100 text-orange-700",
};

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function AdminInboxPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { data, isLoading } = useSupportMessages({
    status: statusFilter,
    type: typeFilter,
  });

  const updateMutation = useUpdateSupportMessage();
  const deleteMutation = useDeleteSupportMessage();

  const messages = data?.messages || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkAsRead = async (message) => {
    if (message.status === "unread") {
      await updateMutation.mutateAsync({
        id: message.id,
        status: "read",
      });
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateMutation.mutateAsync({ id, status });
      toast.success(`Message marked as ${status}`);
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (error) {
      toast.error("Failed to update message");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Message deleted");
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
      } catch (error) {
        toast.error("Failed to delete message");
      }
    }
  };

  const openDetails = (message) => {
    setSelectedMessage(message);
    handleMarkAsRead(message);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Support Inbox</h1>
          <p className="text-muted-foreground">
            Manage support messages and bug reports
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="feature">Feature Request</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No messages found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const TypeIcon = TYPE_ICONS[message.type] || MessageSquare;
            const isUnread = message.status === "unread";

            return (
              <Card
                key={message.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  isUnread ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
                }`}
                onClick={() => openDetails(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${TYPE_COLORS[message.type]}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isUnread ? (
                            <Mail className="h-4 w-4 text-blue-500" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          )}
                          <h3 className={`font-semibold truncate ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                            {message.subject}
                          </h3>
                        </div>

                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {message.message}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {message.tenant?.businessName || message.name || message.email}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                          <Badge className={PRIORITY_COLORS[message.priority]}>
                            {message.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {message.tenant && (
                        <Badge variant="outline" className="text-xs">
                          Tenant
                        </Badge>
                      )}
                      <Badge
                        className={
                          message.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : message.status === "read"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-blue-100 text-blue-700"
                        }
                      >
                        {message.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Message Details Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle>{selectedMessage.subject}</DialogTitle>
                    <DialogDescription className="mt-2">
                      From: {selectedMessage.tenant?.businessName || selectedMessage.name} ({selectedMessage.tenant?.email || selectedMessage.email})
                    </DialogDescription>
                  </div>
                  <Badge className={TYPE_COLORS[selectedMessage.type]}>
                    {selectedMessage.type}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Message:</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                {selectedMessage.metadata && (
                  <div>
                    <h4 className="font-semibold mb-2">Metadata:</h4>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                      {JSON.stringify(selectedMessage.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedMessage.tenant && (
                  <div>
                    <h4 className="font-semibold mb-2">Tenant Info:</h4>
                    <p className="text-sm">Business: {selectedMessage.tenant.businessName}</p>
                    <p className="text-sm">Email: {selectedMessage.tenant.email}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDelete(selectedMessage.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                {selectedMessage.status !== "resolved" && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedMessage.id, "resolved")}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}

                {selectedMessage.status === "resolved" && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedMessage.id, "unread")}
                    disabled={updateMutation.isPending}
                  >
                    Reopen
                  </Button>
                )}

                {selectedMessage.tenant && (
                  <Button asChild>
                    <a href={`/admin/tenants/${selectedMessage.tenant.id}`} target="_blank">
                      View Tenant
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
