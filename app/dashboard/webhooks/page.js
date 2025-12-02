"use client";

import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Switch,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Separator,
} from "@/components/ui";
import {
  Webhook,
  Copy,
  Check,
  Trash2,
  Info,
  Play,
  ExternalLink,
  AlertCircle,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: "",
    description: "",
    events: [],
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/webhooks");
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
        if (data.availableEvents) {
          setAvailableEvents(data.availableEvents);
        }
      }
    } catch (err) {
      console.error(err);
      notifications.show({
        title: "Error",
        message: "Failed to load webhooks",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (webhookId) => {
    try {
      setTestingId(webhookId);
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: "POST",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        notifications.show({
          title: "Test Successful",
          message: `Webhook responded with status ${result.statusCode}`,
          color: "green",
        });
      } else {
        notifications.show({
          title: "Test Failed",
          message: result.error || "Webhook endpoint did not respond correctly",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to test webhook",
        color: "red",
      });
    } finally {
      setTestingId(null);
    }
  };

  const viewDetails = async (webhookId) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedWebhook(data);
        setDetailsOpen(true);
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to load webhook details",
        color: "red",
      });
    }
  };

  // Get display events (from API or fallback)
  const displayEvents = availableEvents.length > 0 ? availableEvents : [
    { event: "booking.created", description: "Triggered when a new booking is created" },
    { event: "booking.cancelled", description: "Triggered when a booking is cancelled" },
    { event: "booking.rescheduled", description: "Triggered when a booking is rescheduled" },
    { event: "client.created", description: "Triggered when a new client is added" },
    { event: "payment.received", description: "Triggered when a payment is received" },
  ];

  const createWebhook = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      notifications.show({
        title: "Validation Error",
        message: "URL and at least one event are required",
        color: "red",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details?.[0] || error.error || "Failed to create webhook");
      }

      const webhook = await response.json();

      notifications.show({
        title: "Webhook Created",
        message: "Copy your signing secret now - it won't be shown again!",
        color: "green",
        autoClose: 10000,
      });

      // Show webhook details with secret
      setSelectedWebhook(webhook);
      setDetailsOpen(true);

      // Refresh list (secret won't be in the list)
      await loadWebhooks();

      // Reset form and close modal
      setNewWebhook({ url: "", description: "", events: [] });
      setWebhookModalOpen(false);
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleWebhook = async (id, currentActive) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) throw new Error("Failed to toggle webhook");

      await loadWebhooks();
      notifications.show({
        title: "Success",
        message: `Webhook ${!currentActive ? "activated" : "deactivated"}`,
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to toggle webhook",
        color: "red",
      });
    }
  };

  const deleteWebhook = async (id) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete webhook");

      await loadWebhooks();
      notifications.show({
        title: "Deleted",
        message: "Webhook has been removed",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to delete webhook",
        color: "red",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleEvent = (eventValue) => {
    if (newWebhook.events.includes(eventValue)) {
      setNewWebhook({
        ...newWebhook,
        events: newWebhook.events.filter(e => e !== eventValue),
      });
    } else {
      setNewWebhook({
        ...newWebhook,
        events: [...newWebhook.events, eventValue],
      });
    }
  };

  const copySecret = async (secret) => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading webhooks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Webhooks</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Receive real-time notifications when events occur in your account
          </p>
        </div>
        <Button size="sm" onClick={() => setWebhookModalOpen(true)} className="text-xs">
          <Webhook className="h-3.5 w-3.5 mr-1.5" />
          Create Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                <Webhook className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">No webhooks configured</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Create a webhook to receive event notifications in real-time
                </p>
              </div>
              <Button size="sm" onClick={() => setWebhookModalOpen(true)} className="text-xs mt-2">
                <Webhook className="h-3.5 w-3.5 mr-1.5" />
                Create Your First Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-zinc-900 truncate">
                        {webhook.description || "Webhook"}
                      </span>
                      <Badge className={cn(
                        "text-[0.625rem]",
                        webhook.active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"
                      )}>
                        {webhook.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-[0.625rem] text-zinc-500 mb-1">Endpoint URL</p>
                        <code className="text-xs bg-zinc-100 px-2 py-1 rounded block truncate">
                          {webhook.url}
                        </code>
                      </div>

                      <div>
                        <p className="text-[0.625rem] text-zinc-500 mb-1">Subscribed Events</p>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="secondary" className="text-[0.625rem]">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <p className="text-[0.625rem] text-zinc-400">
                        Created: {new Date(webhook.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={() => toggleWebhook(webhook.id, webhook.active)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                      disabled={testingId === webhook.id}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {testingId === webhook.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewDetails(webhook.id)}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                      disabled={deletingId === webhook.id}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === webhook.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Webhook Modal */}
      <Dialog open={webhookModalOpen} onOpenChange={setWebhookModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Create Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Webhook URL</Label>
              <Input
                placeholder="https://example.com/webhook"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                className="text-xs"
              />
              <p className="text-[0.625rem] text-zinc-500">
                The endpoint URL where webhook events will be sent
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Input
                placeholder="Production webhook"
                value={newWebhook.description}
                onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                className="text-xs"
              />
              <p className="text-[0.625rem] text-zinc-500">
                A friendly name to identify this webhook
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Events to Subscribe</Label>
              <p className="text-[0.625rem] text-zinc-500 mb-2">
                Select which events will trigger this webhook
              </p>
              <div className="space-y-2 max-h-[200px] overflow-auto">
                {displayEvents.map((eventItem) => (
                  <div
                    key={eventItem.event}
                    className={cn(
                      "p-2 rounded-md border cursor-pointer transition-colors",
                      newWebhook.events.includes(eventItem.event)
                        ? "border-blue-200 bg-blue-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                    onClick={() => toggleEvent(eventItem.event)}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={newWebhook.events.includes(eventItem.event)}
                        onCheckedChange={() => toggleEvent(eventItem.event)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-xs font-medium text-zinc-900">{eventItem.event}</p>
                        <p className="text-[0.625rem] text-zinc-500">{eventItem.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Your signing secret will only be shown once after creation. Make sure to copy it!
                </p>
              </div>
            </div>

            {/* Collapsible Documentation */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setDocsExpanded(!docsExpanded)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-50"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-medium">Webhook Documentation</span>
                </div>
                {docsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>
              {docsExpanded && (
                <div className="border-t border-zinc-200 p-3 space-y-3 bg-zinc-50">
                  <div>
                    <p className="text-xs font-medium text-zinc-900 mb-1">Payload Structure</p>
                    <p className="text-[0.625rem] text-zinc-500 mb-2">
                      All webhook payloads include an event type and data object:
                    </p>
                    <code className="text-[0.625rem] bg-zinc-100 p-2 rounded block whitespace-pre">
{`{
  "event": "booking.created",
  "data": { ... },
  "timestamp": "2024-01-15T10:00:00Z",
  "signature": "sha256_hash_for_verification"
}`}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-900 mb-1">Security</p>
                    <p className="text-[0.625rem] text-zinc-500">
                      Each webhook request includes an HMAC-SHA256 signature in the{" "}
                      <code className="bg-zinc-200 px-1 rounded">X-Webhook-Signature</code> header.
                      Use your webhook secret to verify the authenticity of requests.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-900 mb-1">Retry Policy</p>
                    <p className="text-[0.625rem] text-zinc-500">
                      Failed webhook deliveries will be retried up to 3 times with exponential backoff.
                      Your endpoint should return a 200-299 status code to acknowledge receipt.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setWebhookModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={createWebhook} disabled={creating} className="text-xs">
              {creating && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Webhook Details</DialogTitle>
          </DialogHeader>
          {selectedWebhook && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-[0.625rem] text-zinc-500 mb-1">Endpoint URL</p>
                <code className="text-xs bg-zinc-100 px-2 py-1 rounded block break-all">
                  {selectedWebhook.url}
                </code>
              </div>

              {selectedWebhook.secret && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-900">Save Your Signing Secret</p>
                      <p className="text-[0.625rem] text-amber-800 mt-0.5">
                        This secret will not be shown again. Copy it now!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white border border-amber-200 px-2 py-1 rounded flex-1 truncate">
                      {selectedWebhook.secret}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copySecret(selectedWebhook.secret)}
                      className={cn("h-7 px-2", copiedSecret && "text-green-600 border-green-300")}
                    >
                      {copiedSecret ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {selectedWebhook.secretPreview && !selectedWebhook.secret && (
                <div>
                  <p className="text-[0.625rem] text-zinc-500 mb-1">Signing Secret</p>
                  <code className="text-xs bg-zinc-100 px-2 py-1 rounded">
                    {selectedWebhook.secretPreview}...
                  </code>
                  <p className="text-[0.625rem] text-zinc-400 mt-1">
                    Secret is hidden for security. Create a new webhook to get a new secret.
                  </p>
                </div>
              )}

              <div>
                <p className="text-[0.625rem] text-zinc-500 mb-1">Subscribed Events</p>
                <div className="flex flex-wrap gap-1">
                  {selectedWebhook.events?.map((event) => (
                    <Badge key={event} variant="secondary" className="text-[0.625rem]">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedWebhook.description && (
                <div>
                  <p className="text-[0.625rem] text-zinc-500 mb-1">Description</p>
                  <p className="text-xs text-zinc-900">{selectedWebhook.description}</p>
                </div>
              )}

              {selectedWebhook.deliveries && selectedWebhook.deliveries.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-900 mb-2">Recent Deliveries</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Event</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWebhook.deliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="text-xs">{delivery.event}</TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-[0.625rem]",
                                delivery.statusCode >= 200 && delivery.statusCode < 300
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              )}
                            >
                              {delivery.statusCode || "Failed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500">
                            {new Date(delivery.deliveredAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetailsOpen(false)} className="text-xs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
