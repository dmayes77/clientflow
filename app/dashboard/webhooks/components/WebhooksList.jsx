"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Webhook,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Activity,
  AlertTriangle,
} from "lucide-react";

const WEBHOOK_EVENTS = [
  { id: "booking.created", label: "Booking Created", category: "Bookings" },
  { id: "booking.confirmed", label: "Booking Confirmed", category: "Bookings" },
  { id: "booking.cancelled", label: "Booking Cancelled", category: "Bookings" },
  { id: "booking.rescheduled", label: "Booking Rescheduled", category: "Bookings" },
  { id: "booking.completed", label: "Booking Completed", category: "Bookings" },
  { id: "client.created", label: "Client Created", category: "Clients" },
  { id: "client.updated", label: "Client Updated", category: "Clients" },
  { id: "payment.received", label: "Payment Received", category: "Payments" },
  { id: "payment.failed", label: "Payment Failed", category: "Payments" },
  { id: "payment.refunded", label: "Payment Refunded", category: "Payments" },
  { id: "invoice.sent", label: "Invoice Sent", category: "Invoices" },
  { id: "invoice.paid", label: "Invoice Paid", category: "Invoices" },
  { id: "invoice.overdue", label: "Invoice Overdue", category: "Invoices" },
];

const EVENT_CATEGORIES = [...new Set(WEBHOOK_EVENTS.map((e) => e.category))];

const initialFormState = {
  url: "",
  events: [],
  description: "",
  active: true,
};

export function WebhooksList() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);
  const [webhookToDelete, setWebhookToDelete] = useState(null);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [showSecrets, setShowSecrets] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(
    EVENT_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (error) {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (webhook = null) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        url: webhook.url,
        events: webhook.events || [],
        description: webhook.description || "",
        active: webhook.active,
      });
    } else {
      setEditingWebhook(null);
      setFormData(initialFormState);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWebhook(null);
    setFormData(initialFormState);
  };

  const handleEventToggle = (eventId) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const handleCategoryToggle = (category) => {
    const categoryEvents = WEBHOOK_EVENTS.filter((e) => e.category === category).map((e) => e.id);
    const allSelected = categoryEvents.every((e) => formData.events.includes(e));

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        events: prev.events.filter((e) => !categoryEvents.includes(e)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        events: [...new Set([...prev.events, ...categoryEvents])],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.events.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    setSaving(true);

    try {
      const url = editingWebhook
        ? `/api/webhooks/${editingWebhook.id}`
        : "/api/webhooks";
      const method = editingWebhook ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const savedWebhook = await res.json();
        if (editingWebhook) {
          setWebhooks(webhooks.map((w) => (w.id === savedWebhook.id ? savedWebhook : w)));
          toast.success("Webhook updated");
        } else {
          setWebhooks([savedWebhook, ...webhooks]);
          toast.success("Webhook created");
        }
        handleCloseDialog();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save webhook");
      }
    } catch (error) {
      toast.error("Failed to save webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (webhook) => {
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !webhook.active }),
      });

      if (res.ok) {
        const updatedWebhook = await res.json();
        setWebhooks(webhooks.map((w) => (w.id === updatedWebhook.id ? updatedWebhook : w)));
        toast.success(updatedWebhook.active ? "Webhook enabled" : "Webhook disabled");
      } else {
        toast.error("Failed to update webhook");
      }
    } catch (error) {
      toast.error("Failed to update webhook");
    }
  };

  const handleDelete = async () => {
    if (!webhookToDelete) return;

    try {
      const res = await fetch(`/api/webhooks/${webhookToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== webhookToDelete.id));
        toast.success("Webhook deleted");
      } else {
        toast.error("Failed to delete webhook");
      }
    } catch (error) {
      toast.error("Failed to delete webhook");
    } finally {
      setDeleteDialogOpen(false);
      setWebhookToDelete(null);
    }
  };

  const handleViewDetails = async (webhook) => {
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedWebhook(data);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      toast.error("Failed to load webhook details");
    }
  };

  const copyToClipboard = async (text, label = "Value") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const toggleSecretVisibility = (id) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getRecentDeliveryStatus = (webhook) => {
    if (!webhook.deliveries || webhook.deliveries.length === 0) {
      return { status: "none", label: "No deliveries" };
    }
    const recentSuccess = webhook.deliveries.filter((d) => d.success).length;
    const recentFail = webhook.deliveries.filter((d) => !d.success).length;

    if (recentFail > 0 && recentSuccess === 0) {
      return { status: "error", label: "Failing" };
    }
    if (recentFail > 0) {
      return { status: "warning", label: "Some failures" };
    }
    return { status: "success", label: "Healthy" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-purple-500" />
              Webhook Endpoints
            </CardTitle>
            <CardDescription className="hig-caption-1 mt-1">
              Receive real-time notifications when events occur
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()} className="w-full tablet:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            Add Endpoint
          </Button>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <Webhook className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="hig-subheadline mb-1">No webhooks yet</h3>
              <p className="hig-footnote text-muted-foreground mb-4 max-w-sm">
                Webhooks allow external applications to receive real-time data when events happen in
                your ClientFlow account.
              </p>
              <Button size="sm" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Create Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => {
                const deliveryStatus = getRecentDeliveryStatus(webhook);
                return (
                  <div
                    key={webhook.id}
                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={webhook.active ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {webhook.active ? "Active" : "Disabled"}
                          </Badge>
                          <Badge
                            variant={
                              deliveryStatus.status === "success"
                                ? "success"
                                : deliveryStatus.status === "error"
                                ? "destructive"
                                : deliveryStatus.status === "warning"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {deliveryStatus.status === "success" && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {deliveryStatus.status === "error" && (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {deliveryStatus.status === "warning" && (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {deliveryStatus.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2 min-w-0">
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                          <code className="hig-caption-1 font-mono truncate">{webhook.url}</code>
                        </div>
                        {webhook.description && (
                          <p className="hig-footnote text-muted-foreground mb-2">
                            {webhook.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {webhook.events?.slice(0, 4).map((event) => (
                            <Badge key={event} variant="outline">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events?.length > 4 && (
                            <Badge variant="outline">
                              +{webhook.events.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.active}
                          onCheckedChange={() => handleToggleActive(webhook)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(webhook)}>
                              <Activity className="h-4 w-4 mr-2" />
                              View Deliveries
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(webhook)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setWebhookToDelete(webhook);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Signing Secret */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-col gap-2 fold:flex-row fold:items-center fold:justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="hig-caption-2 text-muted-foreground shrink-0">Signing Secret:</span>
                          <code className="hig-caption-2 font-mono bg-muted px-2 py-0.5 rounded truncate">
                            {showSecrets[webhook.id]
                              ? webhook.secret
                              : "whsec_" + "•".repeat(16)}
                          </code>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleSecretVisibility(webhook.id)}
                          >
                            {showSecrets[webhook.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(webhook.secret, "Secret")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWebhook ? "Edit Webhook" : "Add Webhook Endpoint"}</DialogTitle>
            <DialogDescription>
              {editingWebhook
                ? "Update your webhook configuration"
                : "Configure a URL to receive webhook events"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-app.com/webhooks/clientflow"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The HTTPS URL that will receive webhook payloads
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Production webhook for CRM integration"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Events to Subscribe</Label>
                <ScrollArea className="h-[200px] rounded-md border p-3">
                  {EVENT_CATEGORIES.map((category) => {
                    const categoryEvents = WEBHOOK_EVENTS.filter((e) => e.category === category);
                    const selectedCount = categoryEvents.filter((e) =>
                      formData.events.includes(e.id)
                    ).length;
                    const allSelected = selectedCount === categoryEvents.length;

                    return (
                      <div key={category} className="mb-3">
                        <div
                          className="flex items-center justify-between py-1 cursor-pointer hover:bg-muted/50 rounded px-1"
                          onClick={() =>
                            setExpandedCategories((prev) => ({
                              ...prev,
                              [category]: !prev[category],
                            }))
                          }
                        >
                          <div className="flex items-center gap-2">
                            {expandedCategories[category] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium text-sm">{category}</span>
                            {selectedCount > 0 && (
                              <Badge variant="secondary">
                                {selectedCount}
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryToggle(category);
                            }}
                          >
                            {allSelected ? "Deselect all" : "Select all"}
                          </Button>
                        </div>
                        {expandedCategories[category] && (
                          <div className="ml-6 mt-1 space-y-1">
                            {categoryEvents.map((event) => (
                              <div key={event.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={event.id}
                                  checked={formData.events.includes(event.id)}
                                  onCheckedChange={() => handleEventToggle(event.id)}
                                />
                                <label
                                  htmlFor={event.id}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {event.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {formData.events.length} event{formData.events.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="active" className="font-medium">
                    Active
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Disabled webhooks won't receive events
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingWebhook ? "Save Changes" : "Create Webhook"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook endpoint? This will also delete all
              delivery history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery History Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Webhook Delivery History</DialogTitle>
            <DialogDescription>
              {selectedWebhook?.url && (
                <code className="hig-caption-1 break-all">{selectedWebhook.url}</code>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedWebhook?.deliveries?.length > 0 ? (
              <>
                {/* Mobile Cards */}
                <div className="space-y-3 tablet:hidden">
                  {selectedWebhook.deliveries.map((delivery) => (
                    <div key={delivery.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        {delivery.success ? (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                        <code className="hig-caption-2 text-muted-foreground">
                          {delivery.statusCode || "—"}
                        </code>
                      </div>
                      <code className="block hig-caption-1 truncate">{delivery.event}</code>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="hig-caption-2">
                          {format(new Date(delivery.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden tablet:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="w-[100px]">Code</TableHead>
                        <TableHead className="w-[150px]">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWebhook.deliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell>
                            {delivery.success ? (
                              <Badge variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{delivery.event}</code>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{delivery.statusCode || "—"}</code>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
                                {format(new Date(delivery.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="hig-footnote text-muted-foreground">No deliveries yet</p>
                <p className="hig-caption-1 text-muted-foreground mt-1">
                  Deliveries will appear here when events are triggered
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
