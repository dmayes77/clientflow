"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Calendar,
  Users,
  Package,
  FileText,
  CreditCard,
  Mail,
  Globe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Save,
  Trash2,
  Image,
  Webhook,
  Workflow,
  Eye,
  ExternalLink,
} from "lucide-react";

const STATUS_CONFIG = {
  active: { label: "Active", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  trialing: { label: "Trial", icon: Clock, color: "bg-blue-100 text-blue-700" },
  past_due: { label: "Past Due", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-700" },
  canceled: { label: "Canceled", icon: XCircle, color: "bg-red-100 text-red-700" },
  incomplete: { label: "Incomplete", icon: AlertTriangle, color: "bg-orange-100 text-orange-700" },
};

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function StatusBadge({ status, size = "default" }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "None",
    icon: XCircle,
    color: "bg-zinc-100 text-zinc-600"
  };
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} ${size === "sm" ? "hig-caption2 px-1.5 py-0" : ""}`}>
      <Icon className={size === "sm" ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1"} />
      {config.label}
    </Badge>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <div className="hig-title-2 font-semibold leading-none">{value}</div>
        <div className="hig-caption2 text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function BookingCard({ booking }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
      <div className="min-w-0 flex-1">
        <div className="hig-body font-medium truncate">{booking.contact?.name || "Unknown"}</div>
        <div className="hig-caption2 text-muted-foreground">{formatDate(booking.createdAt)}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="hig-caption2">{booking.status}</Badge>
        <span className="hig-body font-medium">
          {booking.totalPrice ? formatCurrency(booking.totalPrice) : "-"}
        </span>
      </div>
    </div>
  );
}

export default function TenantDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [tenant, setTenant] = useState(null);
  const [usage, setUsage] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState("");
  const [planType, setPlanType] = useState("");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await fetch(`/api/admin/tenants/${id}`);
        if (!res.ok) throw new Error("Failed to fetch tenant");
        const data = await res.json();
        setTenant(data.tenant);
        setUsage(data.usage);
        setRecentBookings(data.recentBookings || []);

        setSubscriptionStatus(data.tenant.subscriptionStatus || "");
        setCurrentPeriodEnd(data.tenant.currentPeriodEnd
          ? new Date(data.tenant.currentPeriodEnd).toISOString().split("T")[0]
          : "");
        setPlanType(data.tenant.planType || "basic");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTenant();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionStatus,
          currentPeriodEnd: currentPeriodEnd || null,
          planType,
        }),
      });
      if (!res.ok) throw new Error("Failed to update tenant");
      const data = await res.json();
      setTenant(data.tenant);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete tenant");
      router.push("/admin/tenants");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: id }),
      });
      if (!res.ok) throw new Error("Failed to start impersonation");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      setImpersonating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold">Error loading tenant</h2>
          <p className="hig-body text-muted-foreground mb-4">{error || "Tenant not found"}</p>
          <Button size="sm" asChild>
            <Link href="/admin/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 h-8" asChild>
          <Link href="/admin/tenants">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="hig-title-2 font-bold truncate sm:hig-title-1">
              {tenant.businessName || tenant.name || "Unnamed"}
            </h1>
            <p className="hig-body text-muted-foreground truncate">{tenant.email}</p>
          </div>
          <StatusBadge status={tenant.subscriptionStatus} size="sm" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <MiniStat icon={Calendar} label="Bookings" value={tenant._count?.bookings || 0} />
        <MiniStat icon={Users} label="Contacts" value={tenant._count?.contacts || 0} />
        <MiniStat icon={Package} label="Services" value={tenant._count?.services || 0} />
        <MiniStat icon={FileText} label="Invoices" value={tenant._count?.invoices || 0} />
      </div>

      {/* View as Tenant Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-10 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
        onClick={handleImpersonate}
        disabled={impersonating}
      >
        <Eye className="mr-2 h-4 w-4" />
        {impersonating ? "Loading..." : "View as Tenant"}
        <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
      </Button>

      {/* Admin Actions - Primary on mobile */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="hig-caption2">Status</Label>
              <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="hig-caption2">Plan</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="hig-caption2">Period End</Label>
            <Input
              type="date"
              value={currentPeriodEnd}
              onChange={(e) => setCurrentPeriodEnd(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="mr-1 h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Subscription</DialogTitle>
                  <DialogDescription>
                    This will mark the tenant's subscription as canceled.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Canceling..." : "Confirm"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base">This Month</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="hig-title-1 font-bold">{usage?.bookingsThisMonth || 0}</div>
              <div className="hig-caption2 text-muted-foreground">Bookings</div>
            </div>
            <div>
              <div className="hig-title-1 font-bold">{formatCurrency(usage?.totalRevenue || 0)}</div>
              <div className="hig-caption2 text-muted-foreground">Revenue</div>
            </div>
            <div>
              <div className="hig-title-1 font-bold">{usage?.totalPayments || 0}</div>
              <div className="hig-caption2 text-muted-foreground">Payments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3 hig-body">
            <div>
              <div className="hig-caption2 text-muted-foreground uppercase">Slug</div>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">/{tenant.slug || "-"}</span>
              </div>
            </div>
            <div>
              <div className="hig-caption2 text-muted-foreground uppercase">Created</div>
              <div>{formatDate(tenant.createdAt)}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="hig-caption2 text-muted-foreground uppercase mb-1">Stripe Connect</div>
            {tenant.stripeAccountId ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-green-600 hig-caption2">
                  <CreditCard className="h-2.5 w-2.5 mr-0.5" />
                  Connected
                </Badge>
                <span className="hig-caption2 text-muted-foreground">
                  {tenant.stripeAccountStatus || "unknown"}
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="text-muted-foreground hig-caption2">
                Not Connected
              </Badge>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2 text-center hig-body">
            <div className="flex flex-col items-center gap-1">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span>{tenant._count?.images || 0}</span>
              <span className="hig-caption2 text-muted-foreground">Images</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Workflow className="h-4 w-4 text-muted-foreground" />
              <span>{tenant._count?.workflows || 0}</span>
              <span className="hig-caption2 text-muted-foreground">Workflows</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Webhook className="h-4 w-4 text-muted-foreground" />
              <span>{tenant._count?.webhooks || 0}</span>
              <span className="hig-caption2 text-muted-foreground">Webhooks</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {recentBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* IDs - collapsible or at bottom */}
      <Card>
        <CardContent className="p-3">
          <div className="hig-caption2 text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Tenant ID:</span>
              <span className="font-mono truncate ml-2">{tenant.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Clerk Org:</span>
              <span className="font-mono truncate ml-2">{tenant.clerkOrgId || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
