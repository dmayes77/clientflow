"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertTriangle,
  Bell,
  CreditCard,
  XCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  Megaphone,
  CheckCircle,
  Clock,
  Trash2,
  Users,
  Search,
  Zap,
  Pencil,
  Play,
  Pause,
  Loader2,
  RotateCw,
  Sparkles,
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
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ==================== ALERTS TAB COMPONENTS ====================

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
                <div className="font-medium truncate">{alert.title}</div>
                <p className="text-muted-foreground mt-0.5 line-clamp-2 hig-caption2">
                  {alert.message}
                </p>
              </div>
              <Badge className={`shrink-0 ${severityConfig.color}`}>
                {severityConfig.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {alert.tenant && (
                <Link
                  href={`/admin/tenants/${alert.tenant.id}`}
                  className="text-primary hover:underline hig-caption2"
                >
                  {alert.tenant.businessName || alert.tenant.name}
                </Link>
              )}
              {alert.isGlobal && (
                <Badge variant="outline">Global</Badge>
              )}
              <span className="text-muted-foreground ml-auto hig-caption2">
                {formatDate(alert.createdAt)}
              </span>
            </div>

            {(alert.actionUrl || !alert.dismissed) && (
              <div className="flex gap-2 mt-2">
                {alert.actionUrl && (
                  <Button size="sm" variant="outline" className="h-7" asChild>
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
                    className="h-7 ml-auto"
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
            className="h-8 shrink-0"
            onClick={() => onChange(type.value)}
          >
            {type.label}
            {count > 0 && (
              <span className="ml-1 opacity-70 hig-caption2">({count})</span>
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
    try {
      const res = await fetch(`/api/admin/tenants?search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.tenants || []);
      }
    } catch (err) {
      console.error(err);
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
          New Alert
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
          <div className="space-y-1">
            <Label>Target</Label>
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

          {targetType === "specific" && (
            <div className="space-y-2">
              <Label>Select Tenants</Label>
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
                        className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between"
                        onClick={() => addTenant(tenant)}
                      >
                        <span className="truncate">{tenant.businessName || tenant.name}</span>
                        <span className="text-muted-foreground truncate ml-2 hig-caption2">{tenant.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedTenants.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTenants.map((tenant) => (
                    <Badge key={tenant.id} variant="secondary" className="gap-1">
                      {tenant.businessName || tenant.name}
                      <button onClick={() => removeTenant(tenant.id)} className="hover:text-destructive">
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Alert title..."
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Alert message..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Action URL (optional)</Label>
              <Input
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="https://..."
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label>Button Label</Label>
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
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={creating || !form.title || !form.message || (targetType === "specific" && selectedTenants.length === 0)}
          >
            {creating ? "Creating..." : targetType === "broadcast" ? "Broadcast" : `Send to ${selectedTenants.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== AUTOMATION TAB COMPONENTS ====================

function RuleCard({ rule, onEdit, onToggle, onDelete, scheduleTypes, eventTypes, plans }) {
  const isScheduled = rule.triggerType === "schedule";
  const triggerLabel = isScheduled
    ? scheduleTypes.find((s) => s.value === rule.scheduleType)?.label || rule.scheduleType
    : eventTypes.find((e) => e.value === rule.eventType)?.label || rule.eventType;

  // Count active filters
  const filters = rule.filters || {};
  const filterCount = [
    filters.planIds?.length > 0,
    filters.subscriptionStatuses?.length > 0,
    filters.minBookings !== undefined,
    filters.maxBookings !== undefined,
    filters.minContacts !== undefined,
    filters.maxContacts !== undefined,
    filters.minTenantAgeDays !== undefined,
    filters.hasPaymentMethod !== undefined,
    filters.stripeConnectStatus,
    filters.setupComplete !== undefined,
  ].filter(Boolean).length;

  // Get plan names for display
  const planNames = filters.planIds?.map((id) => plans?.find((p) => p.value === id)?.label).filter(Boolean) || [];

  return (
    <Card className={!rule.active ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`p-1 rounded ${isScheduled ? "bg-blue-100" : "bg-purple-100"}`}>
                {isScheduled ? (
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-purple-600" />
                )}
              </span>
              <h3 className="font-semibold">{rule.name}</h3>
              {!rule.active && <Badge variant="outline">Paused</Badge>}
            </div>

            {rule.description && (
              <p className="text-muted-foreground mb-2 hig-caption2">{rule.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary">
                {isScheduled ? "Scheduled" : "Event"}: {triggerLabel}
              </Badge>
              <Badge className={`${SEVERITY_CONFIG[rule.alertType]?.color}`}>
                {SEVERITY_CONFIG[rule.alertType]?.label || rule.alertType}
              </Badge>
              {rule.cooldownHours > 0 && (
                <Badge variant="outline">{rule.cooldownHours}h cooldown</Badge>
              )}
              {filterCount > 0 && (
                <Badge variant="outline" className="hig-caption2 bg-amber-50 border-amber-200">
                  <Users className="h-2.5 w-2.5 mr-1" />
                  {filterCount} filter{filterCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Show filter details */}
            {filterCount > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 hig-caption2">
                {planNames.length > 0 && (
                  <span className="text-muted-foreground">Plans: {planNames.join(", ")}</span>
                )}
                {filters.subscriptionStatuses?.length > 0 && (
                  <span className="text-muted-foreground">• Status: {filters.subscriptionStatuses.join(", ")}</span>
                )}
                {filters.minBookings !== undefined && (
                  <span className="text-muted-foreground">• Min bookings: {filters.minBookings}</span>
                )}
              </div>
            )}

            <div className="bg-muted/50 rounded p-2 mb-2">
              <p className="font-medium">{rule.alertTitle}</p>
              <p className="text-muted-foreground line-clamp-2 hig-caption2">{rule.alertMessage}</p>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground hig-caption2">
              <span>Sent: {rule.alertsSent}</span>
              <span>Last run: {formatDate(rule.lastRunAt)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onToggle(rule)}>
              {rule.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(rule)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => onDelete(rule)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== MAIN PAGE COMPONENT ====================

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("alerts");

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [typeCounts, setTypeCounts] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  // Rules state
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [scheduleTypes, setScheduleTypes] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [plans, setPlans] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "", description: "", triggerType: "schedule", scheduleType: "", eventType: "",
    alertType: "warning", alertTitle: "", alertMessage: "", actionUrl: "", actionLabel: "",
    active: true, cooldownHours: 24,
    filters: {
      planIds: [],
      subscriptionStatuses: [],
      minBookings: "",
      maxBookings: "",
      minContacts: "",
      maxContacts: "",
      minTenantAgeDays: "",
      hasPaymentMethod: null,
      stripeConnectStatus: "",
      setupComplete: null,
    },
  });

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
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
      setAlertsLoading(false);
    }
  };

  // Fetch rules
  const fetchRules = async () => {
    try {
      const res = await fetch("/api/admin/alert-rules");
      if (!res.ok) throw new Error("Failed to fetch rules");
      const data = await res.json();
      setRules(data.rules);
    } catch (err) {
      setError(err.message);
    } finally {
      setRulesLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await fetch("/api/admin/alert-rules?action=options");
      if (!res.ok) throw new Error("Failed to fetch options");
      const data = await res.json();
      setScheduleTypes(data.scheduleTypes);
      setEventTypes(data.eventTypes);
      setFilterOptions(data.filterOptions || {});
      setPlans(data.plans || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [typeFilter]);

  useEffect(() => {
    if (activeTab === "automation") {
      fetchRules();
      fetchOptions();
    }
  }, [activeTab]);

  const handleDismiss = async (alertId) => {
    try {
      await fetch("/api/admin/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, dismissed: true }),
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  // Rule handlers
  const resetRuleForm = () => {
    setFormData({
      name: "", description: "", triggerType: "schedule", scheduleType: "", eventType: "",
      alertType: "warning", alertTitle: "", alertMessage: "", actionUrl: "", actionLabel: "",
      active: true, cooldownHours: 24,
      filters: {
        planIds: [],
        subscriptionStatuses: [],
        minBookings: "",
        maxBookings: "",
        minContacts: "",
        maxContacts: "",
        minTenantAgeDays: "",
        hasPaymentMethod: null,
        stripeConnectStatus: "",
        setupComplete: null,
      },
    });
    setEditingRule(null);
    setError(null);
  };

  const openEditDialog = (rule) => {
    setEditingRule(rule);
    const ruleFilters = rule.filters || {};
    setFormData({
      name: rule.name, description: rule.description || "", triggerType: rule.triggerType,
      scheduleType: rule.scheduleType || "", eventType: rule.eventType || "", alertType: rule.alertType,
      alertTitle: rule.alertTitle, alertMessage: rule.alertMessage, actionUrl: rule.actionUrl || "",
      actionLabel: rule.actionLabel || "", active: rule.active, cooldownHours: rule.cooldownHours,
      filters: {
        planIds: ruleFilters.planIds || [],
        subscriptionStatuses: ruleFilters.subscriptionStatuses || [],
        minBookings: ruleFilters.minBookings ?? "",
        maxBookings: ruleFilters.maxBookings ?? "",
        minContacts: ruleFilters.minContacts ?? "",
        maxContacts: ruleFilters.maxContacts ?? "",
        minTenantAgeDays: ruleFilters.minTenantAgeDays ?? "",
        hasPaymentMethod: ruleFilters.hasPaymentMethod ?? null,
        stripeConnectStatus: ruleFilters.stripeConnectStatus || "",
        setupComplete: ruleFilters.setupComplete ?? null,
      },
    });
    setError(null);
    setRuleDialogOpen(true);
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Clean up filters - only include non-empty values
      const cleanFilters = {};
      const f = formData.filters;
      if (f.planIds?.length > 0) cleanFilters.planIds = f.planIds;
      if (f.subscriptionStatuses?.length > 0) cleanFilters.subscriptionStatuses = f.subscriptionStatuses;
      if (f.minBookings !== "" && f.minBookings !== undefined) cleanFilters.minBookings = parseInt(f.minBookings);
      if (f.maxBookings !== "" && f.maxBookings !== undefined) cleanFilters.maxBookings = parseInt(f.maxBookings);
      if (f.minContacts !== "" && f.minContacts !== undefined) cleanFilters.minContacts = parseInt(f.minContacts);
      if (f.maxContacts !== "" && f.maxContacts !== undefined) cleanFilters.maxContacts = parseInt(f.maxContacts);
      if (f.minTenantAgeDays !== "" && f.minTenantAgeDays !== undefined) cleanFilters.minTenantAgeDays = parseInt(f.minTenantAgeDays);
      if (f.hasPaymentMethod !== null) cleanFilters.hasPaymentMethod = f.hasPaymentMethod;
      if (f.stripeConnectStatus) cleanFilters.stripeConnectStatus = f.stripeConnectStatus;
      if (f.setupComplete !== null) cleanFilters.setupComplete = f.setupComplete;

      const payload = {
        ...formData,
        filters: Object.keys(cleanFilters).length > 0 ? cleanFilters : null,
      };
      if (editingRule) payload.id = editingRule.id;
      const res = await fetch("/api/admin/alert-rules", {
        method: editingRule ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save rule");
      }
      await fetchRules();
      setRuleDialogOpen(false);
      resetRuleForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule) => {
    try {
      await fetch("/api/admin/alert-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, active: !rule.active }),
      });
      await fetchRules();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingRule) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/alert-rules?id=${deletingRule.id}`, { method: "DELETE" });
      await fetchRules();
      setDeleteDialogOpen(false);
      setDeletingRule(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await fetch("/api/admin/alert-rules?action=seed");
      await fetchRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleRunCron = async () => {
    setRunningCron(true);
    try {
      const res = await fetch("/api/cron/alerts");
      const data = await res.json();
      alert(`Cron completed: ${data.alertsSent} alerts sent, ${data.alertsSkipped} skipped`);
      await fetchRules();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunningCron(false);
    }
  };

  const scheduledRules = rules.filter((r) => r.triggerType === "schedule");
  const eventRules = rules.filter((r) => r.triggerType === "event");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread{criticalCount > 0 && `, ${criticalCount} critical`}
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="alerts" className="flex-1">
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex-1">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* ALERTS TAB */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <CreateAlertDialog onCreated={fetchAlerts} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="hig-title-1 font-bold text-red-600">{criticalCount}</div>
                <div className="text-muted-foreground hig-caption2">Critical</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="hig-title-1 font-bold text-orange-600">{typeCounts.dispute || 0}</div>
                <div className="text-muted-foreground hig-caption2">Disputes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="hig-title-1 font-bold">{unreadCount}</div>
                <div className="text-muted-foreground hig-caption2">Unread</div>
              </CardContent>
            </Card>
          </div>

          <TypeFilter value={typeFilter} onChange={setTypeFilter} counts={typeCounts} />

          {alertsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No alerts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onDismiss={handleDismiss} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* AUTOMATION TAB */}
        <TabsContent value="automation" className="space-y-4 mt-4">
          <div className="flex justify-end gap-2">
            {rules.length === 0 && (
              <Button variant="outline" size="sm" onClick={handleSeedDefaults} disabled={seeding}>
                {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Add Defaults
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleRunCron} disabled={runningCron}>
              {runningCron ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RotateCw className="h-3.5 w-3.5 mr-1" />}
              <span className="hidden sm:inline">Run Now</span>
            </Button>
            <Button size="sm" onClick={() => { resetRuleForm(); setRuleDialogOpen(true); }}>
              <Plus className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">New Rule</span>
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="hig-title-1 font-bold">{rules.filter((r) => r.active).length}</div>
                <div className="text-muted-foreground hig-caption2">Active Rules</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="hig-title-1 font-bold text-blue-600">{scheduledRules.length}</div>
                <div className="text-muted-foreground hig-caption2">Scheduled</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="hig-title-1 font-bold text-purple-600">{eventRules.length}</div>
                <div className="text-muted-foreground hig-caption2">Event-Based</div>
              </CardContent>
            </Card>
          </div>

          {rulesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-1">No automation rules</h3>
                <p className="hig-body text-muted-foreground mb-4">
                  Create rules for trial expirations, payment failures, and more.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleSeedDefaults} disabled={seeding}>
                    {seeding && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                    Add Default Rules
                  </Button>
                  <Button onClick={() => { resetRuleForm(); setRuleDialogOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create Custom
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="scheduled">
              <TabsList className="w-full">
                <TabsTrigger value="scheduled" className="flex-1">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Scheduled ({scheduledRules.length})
                </TabsTrigger>
                <TabsTrigger value="event" className="flex-1">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Event ({eventRules.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="scheduled" className="space-y-3 mt-3">
                {scheduledRules.length === 0 ? (
                  <Card><CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No scheduled rules</p>
                  </CardContent></Card>
                ) : (
                  scheduledRules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} onEdit={openEditDialog} onToggle={handleToggle}
                      onDelete={(r) => { setDeletingRule(r); setDeleteDialogOpen(true); }}
                      scheduleTypes={scheduleTypes} eventTypes={eventTypes} plans={plans} />
                  ))
                )}
              </TabsContent>
              <TabsContent value="event" className="space-y-3 mt-3">
                {eventRules.length === 0 ? (
                  <Card><CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No event-based rules</p>
                  </CardContent></Card>
                ) : (
                  eventRules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} onEdit={openEditDialog} onToggle={handleToggle}
                      onDelete={(r) => { setDeletingRule(r); setDeleteDialogOpen(true); }}
                      scheduleTypes={scheduleTypes} eventTypes={eventTypes} plans={plans} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Create Rule"}</DialogTitle>
            <DialogDescription>Configure automated alerts.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRuleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Trial Expiring Soon" required className="h-9" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="What this rule does..." className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Trigger Type *</Label>
                <Select value={formData.triggerType} onValueChange={(v) => setFormData((p) => ({ ...p, triggerType: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="schedule"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Scheduled</div></SelectItem>
                    <SelectItem value="event"><div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5" />Event-Based</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.triggerType === "schedule" ? (
                <div className="space-y-1">
                  <Label>Condition *</Label>
                  <Select value={formData.scheduleType} onValueChange={(v) => setFormData((p) => ({ ...p, scheduleType: v }))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {scheduleTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>Event *</Label>
                  <Select value={formData.eventType} onValueChange={(v) => setFormData((p) => ({ ...p, eventType: v }))}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={formData.alertType} onValueChange={(v) => setFormData((p) => ({ ...p, alertType: v }))}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cooldown (hours)</Label>
                <Input type="number" min="0" value={formData.cooldownHours}
                  onChange={(e) => setFormData((p) => ({ ...p, cooldownHours: parseInt(e.target.value) || 0 }))} className="h-9" />
              </div>
            </div>

            {/* Filters Section - Only for scheduled rules */}
            {formData.triggerType === "schedule" && (
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Target Filters</span>
                  <span className="text-muted-foreground hig-caption2">(Optional - narrow down recipients)</span>
                </div>

                {/* Plan Filter */}
                {plans.length > 0 && (
                  <div className="space-y-1">
                    <Label>Plans</Label>
                    <div className="flex flex-wrap gap-1">
                      {plans.map((plan) => (
                        <Badge
                          key={plan.value}
                          variant={formData.filters.planIds.includes(plan.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const current = formData.filters.planIds;
                            const updated = current.includes(plan.value)
                              ? current.filter((id) => id !== plan.value)
                              : [...current, plan.value];
                            setFormData((p) => ({ ...p, filters: { ...p.filters, planIds: updated } }));
                          }}
                        >
                          {plan.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscription Status Filter */}
                <div className="space-y-1">
                  <Label>Subscription Status</Label>
                  <div className="flex flex-wrap gap-1">
                    {filterOptions.subscriptionStatuses?.map((status) => (
                      <Badge
                        key={status.value}
                        variant={formData.filters.subscriptionStatuses.includes(status.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = formData.filters.subscriptionStatuses;
                          const updated = current.includes(status.value)
                            ? current.filter((s) => s !== status.value)
                            : [...current, status.value];
                          setFormData((p) => ({ ...p, filters: { ...p.filters, subscriptionStatuses: updated } }));
                        }}
                      >
                        {status.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Activity Thresholds */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Min Bookings</Label>
                    <Input type="number" min="0" value={formData.filters.minBookings}
                      onChange={(e) => setFormData((p) => ({ ...p, filters: { ...p.filters, minBookings: e.target.value } }))}
                      placeholder="Any" className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label>Max Bookings</Label>
                    <Input type="number" min="0" value={formData.filters.maxBookings}
                      onChange={(e) => setFormData((p) => ({ ...p, filters: { ...p.filters, maxBookings: e.target.value } }))}
                      placeholder="Any" className="h-8" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Min Contacts</Label>
                    <Input type="number" min="0" value={formData.filters.minContacts}
                      onChange={(e) => setFormData((p) => ({ ...p, filters: { ...p.filters, minContacts: e.target.value } }))}
                      placeholder="Any" className="h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label>Min Tenant Age (days)</Label>
                    <Input type="number" min="0" value={formData.filters.minTenantAgeDays}
                      onChange={(e) => setFormData((p) => ({ ...p, filters: { ...p.filters, minTenantAgeDays: e.target.value } }))}
                      placeholder="Any" className="h-8" />
                  </div>
                </div>

                {/* Boolean Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Payment Method</Label>
                    <Select
                      value={formData.filters.hasPaymentMethod === null ? "any" : formData.filters.hasPaymentMethod.toString()}
                      onValueChange={(v) => setFormData((p) => ({
                        ...p, filters: { ...p.filters, hasPaymentMethod: v === "any" ? null : v === "true" }
                      }))}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="true">Has Payment Method</SelectItem>
                        <SelectItem value="false">No Payment Method</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Stripe Connect Status</Label>
                    <Select
                      value={formData.filters.stripeConnectStatus || "any"}
                      onValueChange={(v) => setFormData((p) => ({
                        ...p, filters: { ...p.filters, stripeConnectStatus: v === "any" ? "" : v }
                      }))}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {filterOptions.stripeConnectStatuses?.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Setup Complete</Label>
                  <Select
                    value={formData.filters.setupComplete === null ? "any" : formData.filters.setupComplete.toString()}
                    onValueChange={(v) => setFormData((p) => ({
                      ...p, filters: { ...p.filters, setupComplete: v === "any" ? null : v === "true" }
                    }))}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="true">Completed</SelectItem>
                      <SelectItem value="false">Not Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>Alert Title *</Label>
              <Input value={formData.alertTitle} onChange={(e) => setFormData((p) => ({ ...p, alertTitle: e.target.value }))}
                placeholder="e.g., Your trial expires in {{daysRemaining}} days" required className="h-9" />
              <p className="text-muted-foreground hig-caption2">
                Placeholders: {"{{tenantName}}"}, {"{{businessName}}"}, {"{{daysRemaining}}"}, {"{{expiryDate}}"}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Alert Message *</Label>
              <Textarea value={formData.alertMessage} onChange={(e) => setFormData((p) => ({ ...p, alertMessage: e.target.value }))}
                placeholder="The alert message..." required rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Action URL (optional)</Label>
                <Input value={formData.actionUrl} onChange={(e) => setFormData((p) => ({ ...p, actionUrl: e.target.value }))}
                  placeholder="/dashboard/billing" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label>Action Label</Label>
                <Input value={formData.actionLabel} onChange={(e) => setFormData((p) => ({ ...p, actionLabel: e.target.value }))}
                  placeholder="Upgrade Now" className="h-9" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch id="active" checked={formData.active} onCheckedChange={(v) => setFormData((p) => ({ ...p, active: v }))} />
              <Label htmlFor="active" className="cursor-pointer">Active</Label>
            </div>
            {error && <div className="text-red-500 bg-red-50 p-2 rounded hig-caption2">{error}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                {editingRule ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingRule?.name}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
