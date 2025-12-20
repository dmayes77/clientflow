"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Bell,
  CreditCard,
  XCircle,
  Info,
  AlertCircle,
  Plus,
  ExternalLink,
  Megaphone,
  CheckCircle,
  Clock,
  Trash2,
  Users,
  Search,
} from "lucide-react";

const TYPE_CONFIG = {
  dispute: { label: "Dispute", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  payment_failed: { label: "Payment Failed", icon: CreditCard, color: "text-orange-600 bg-orange-50" },
  account_issue: { label: "Account Issue", icon: AlertCircle, color: "text-yellow-600 bg-yellow-50" },
  system: { label: "System", icon: Bell, color: "text-blue-600 bg-blue-50" },
  announcement: { label: "Announcement", icon: Megaphone, color: "text-purple-600 bg-purple-50" },
};

const SEVERITY_CONFIG = {
  critical: { label: "Critical", color: "bg-red-100 text-red-700" },
  error: { label: "Error", color: "bg-orange-100 text-orange-700" },
  warning: { label: "Warning", color: "bg-yellow-100 text-yellow-700" },
  info: { label: "Info", color: "bg-blue-100 text-blue-700" },
};

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function AlertCard({ alert, onDismiss }) {
  const typeConfig = TYPE_CONFIG[alert.type] || TYPE_CONFIG.system;
  const severityConfig = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
  const Icon = typeConfig.icon;

  return (
    <Card className={`${alert.dismissed ? "opacity-50" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${typeConfig.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{alert.title}</div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {alert.message}
                </p>
              </div>
              <Badge className={`shrink-0 text-[10px] ${severityConfig.color}`}>
                {severityConfig.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {alert.tenant && (
                <Link
                  href={`/admin/tenants/${alert.tenant.id}`}
                  className="text-[10px] text-primary hover:underline"
                >
                  {alert.tenant.businessName || alert.tenant.name}
                </Link>
              )}
              {alert.isGlobal && (
                <Badge variant="outline" className="text-[10px]">Global</Badge>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {formatDate(alert.createdAt)}
              </span>
            </div>

            {(alert.actionUrl || !alert.dismissed) && (
              <div className="flex gap-2 mt-2">
                {alert.actionUrl && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <a href={alert.actionUrl} target="_blank" rel="noopener noreferrer">
                      {alert.actionLabel || "View"}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
                {!alert.dismissed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs ml-auto"
                    onClick={() => onDismiss(alert.id)}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TypeFilter({ value, onChange, counts }) {
  const types = [
    { value: "all", label: "All" },
    { value: "dispute", label: "Disputes" },
    { value: "payment_failed", label: "Payments" },
    { value: "announcement", label: "Announcements" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3">
      {types.map((type) => {
        const count = type.value === "all"
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[type.value] || 0;

        return (
          <Button
            key={type.value}
            variant={value === type.value ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={() => onChange(type.value)}
          >
            {type.label}
            {count > 0 && (
              <span className="ml-1 text-[10px] opacity-70">({count})</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

function CreateAlertDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [targetType, setTargetType] = useState("broadcast");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    severity: "info",
    type: "announcement",
    actionUrl: "",
    actionLabel: "",
  });

  const searchTenants = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/tenants?search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tenants || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addTenant = (tenant) => {
    if (!selectedTenants.find((t) => t.id === tenant.id)) {
      setSelectedTenants([...selectedTenants, tenant]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeTenant = (tenantId) => {
    setSelectedTenants(selectedTenants.filter((t) => t.id !== tenantId));
  };

  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      severity: "info",
      type: "announcement",
      actionUrl: "",
      actionLabel: "",
    });
    setSelectedTenants([]);
    setTargetType("broadcast");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        ...form,
        broadcast: targetType === "broadcast",
        tenantIds: targetType === "specific" ? selectedTenants.map((t) => t.id) : [],
      };
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create alert");
      setOpen(false);
      resetForm();
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Alert</DialogTitle>
          <DialogDescription>
            Send an alert to all tenants or specific ones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Target Selection */}
          <div className="space-y-1">
            <Label className="text-xs">Target</Label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="broadcast">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-3.5 w-3.5" />
                    Broadcast to All
                  </div>
                </SelectItem>
                <SelectItem value="specific">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Specific Tenants
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tenant Search (when specific) */}
          {targetType === "specific" && (
            <div className="space-y-2">
              <Label className="text-xs">Select Tenants</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchTenants(e.target.value);
                  }}
                  placeholder="Search by name or email..."
                  className="h-9 pl-8"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-auto">
                    {searchResults.map((tenant) => (
                      <button
                        key={tenant.id}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                        onClick={() => addTenant(tenant)}
                      >
                        <span className="truncate">{tenant.businessName || tenant.name}</span>
                        <span className="text-xs text-muted-foreground truncate ml-2">{tenant.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedTenants.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTenants.map((tenant) => (
                    <Badge key={tenant.id} variant="secondary" className="text-xs gap-1">
                      {tenant.businessName || tenant.name}
                      <button
                        onClick={() => removeTenant(tenant.id)}
                        className="hover:text-destructive"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {selectedTenants.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Search and select tenants to send this alert to.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Alert title..."
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Message</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Alert message..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Severity</Label>
              <Select
                value={form.severity}
                onValueChange={(v) => setForm({ ...form, severity: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Action URL (optional)</Label>
              <Input
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="https://..."
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Button Label</Label>
              <Input
                value={form.actionLabel}
                onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
                placeholder="Learn More"
                className="h-9"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={
              creating ||
              !form.title ||
              !form.message ||
              (targetType === "specific" && selectedTenants.length === 0)
            }
          >
            {creating
              ? "Creating..."
              : targetType === "broadcast"
              ? "Broadcast"
              : `Send to ${selectedTenants.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [typeCounts, setTypeCounts] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }
      const res = await fetch(`/api/admin/alerts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAlerts(data.alerts);
      setTypeCounts(data.typeCounts || {});
      setUnreadCount(data.unreadCount || 0);
      setCriticalCount(data.criticalCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [typeFilter]);

  const handleDismiss = async (alertId) => {
    try {
      await fetch("/api/admin/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, dismissed: true }),
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread{criticalCount > 0 && `, ${criticalCount} critical`}
          </p>
        </div>
        <CreateAlertDialog onCreated={fetchAlerts} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-[10px] text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-orange-600">
              {typeCounts.dispute || 0}
            </div>
            <div className="text-[10px] text-muted-foreground">Disputes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold">{unreadCount}</div>
            <div className="text-[10px] text-muted-foreground">Unread</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TypeFilter value={typeFilter} onChange={setTypeFilter} counts={typeCounts} />

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No alerts</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}
