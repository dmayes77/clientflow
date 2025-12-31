"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useImpersonateTenant } from "@/lib/hooks/use-admin";
import { useAdminPlans } from "@/lib/hooks/use-admin-plans";
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

import { formatCurrency, formatDate } from "@/lib/formatters";
import { SubscriptionStatusBadge } from "@/components/ui/status-badge";

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 min-w-0">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="hig-title-2 font-semibold leading-none truncate">{value}</div>
        <div className="hig-caption-2 text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}

function BookingCard({ booking }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
      <div className="min-w-0 flex-1">
        <div className="hig-body font-medium truncate">{booking.contact?.name || "Unknown"}</div>
        <div className="hig-caption-2 text-muted-foreground">{formatDate(booking.createdAt)}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="hig-caption-2">{booking.status}</Badge>
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
  const queryClient = useQueryClient();

  const [subscriptionStatus, setSubscriptionStatus] = useState("");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState("");
  const [planType, setPlanType] = useState("");
  const [accountType, setAccountType] = useState("standard");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["admin-tenant", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tenants/${id}`);
      if (!res.ok) throw new Error("Failed to fetch tenant");
      return res.json();
    },
  });

  const { data: plansData } = useAdminPlans();
  const plans = plansData?.plans || [];

  const tenant = data?.tenant;
  const usage = data?.usage;
  const recentBookings = data?.recentBookings || [];

  // Sync form state with fetched data
  useEffect(() => {
    if (tenant) {
      setSubscriptionStatus(tenant.subscriptionStatus || "");
      setCurrentPeriodEnd(tenant.currentPeriodEnd
        ? new Date(tenant.currentPeriodEnd).toISOString().split("T")[0]
        : "");
      setPlanType(tenant.planType || "basic");
      setAccountType(tenant.accountType || "standard");
    }
  }, [tenant]);

  const updateMutation = useMutation({
    mutationFn: async (updates) => {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update tenant");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-tenant", id]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/tenants/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete tenant");
    },
    onSuccess: () => {
      router.push("/admin/tenants");
    },
  });

  const impersonateMutation = useImpersonateTenant();
  const handleImpersonateSuccess = () => {
    router.push("/dashboard");
  };

  const handleSave = () => {
    updateMutation.mutate({
      subscriptionStatus,
      currentPeriodEnd: currentPeriodEnd || null,
      planType,
      accountType,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleImpersonate = () => {
    impersonateMutation.mutate(id, {
      onSuccess: handleImpersonateSuccess,
    });
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
          <p className="hig-body text-muted-foreground mb-4">{error?.message || "Tenant not found"}</p>
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
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="min-w-0">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 h-8" asChild>
          <Link href="/admin/tenants">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <h1 className="hig-title-2 font-bold truncate sm:hig-title-1">
              {tenant.businessName || tenant.name || "Unnamed"}
            </h1>
            <p className="hig-body text-muted-foreground truncate">{tenant.email}</p>
          </div>
          <SubscriptionStatusBadge status={tenant.subscriptionStatus} size="sm" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 min-w-0">
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
        disabled={impersonateMutation.isPending}
      >
        <Eye className="mr-2 h-4 w-4" />
        {impersonateMutation.isPending ? "Loading..." : "View as Tenant"}
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
              <Label className="hig-caption-2">Status</Label>
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
              <Label className="hig-caption-2">Plan</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.slug}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="hig-caption-2">Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="demo">Demo (Full Access, No Charges)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="hig-caption-2">Period End</Label>
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
              disabled={updateMutation.isPending}
            >
              <Save className="mr-1 h-3.5 w-3.5" />
              {updateMutation.isPending ? "Saving..." : "Save"}
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
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Canceling..." : "Confirm"}
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
          <div className="grid grid-cols-3 gap-3 text-center min-w-0">
            <div className="min-w-0">
              <div className="hig-title-1 font-bold truncate">{usage?.bookingsThisMonth || 0}</div>
              <div className="hig-caption-2 text-muted-foreground truncate">Bookings</div>
            </div>
            <div className="min-w-0">
              <div className="hig-title-1 font-bold truncate">{formatCurrency(usage?.totalRevenue || 0)}</div>
              <div className="hig-caption-2 text-muted-foreground truncate">Revenue</div>
            </div>
            <div className="min-w-0">
              <div className="hig-title-1 font-bold truncate">{usage?.totalPayments || 0}</div>
              <div className="hig-caption-2 text-muted-foreground truncate">Payments</div>
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
          <div className="grid grid-cols-2 gap-3 hig-body min-w-0">
            <div className="min-w-0">
              <div className="hig-caption-2 text-muted-foreground uppercase">Slug</div>
              <div className="flex items-center gap-1 min-w-0">
                <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">/{tenant.slug || "-"}</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="hig-caption-2 text-muted-foreground uppercase">Created</div>
              <div className="truncate">{formatDate(tenant.createdAt)}</div>
            </div>
          </div>

          <Separator />

          <div className="min-w-0">
            <div className="hig-caption-2 text-muted-foreground uppercase mb-1">Stripe Connect</div>
            {tenant.stripeAccountId ? (
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Badge variant="outline" className="text-green-600 hig-caption-2">
                  <CreditCard className="h-2.5 w-2.5 mr-0.5" />
                  Connected
                </Badge>
                <span className="hig-caption-2 text-muted-foreground truncate">
                  {tenant.stripeAccountStatus || "unknown"}
                </span>
              </div>
            ) : (
              <Badge variant="outline" className="text-muted-foreground hig-caption-2">
                Not Connected
              </Badge>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2 text-center hig-body min-w-0">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="truncate w-full">{tenant._count?.images || 0}</span>
              <span className="hig-caption-2 text-muted-foreground truncate w-full">Images</span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <Workflow className="h-4 w-4 text-muted-foreground" />
              <span className="truncate w-full">{tenant._count?.workflows || 0}</span>
              <span className="hig-caption-2 text-muted-foreground truncate w-full">Workflows</span>
            </div>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <Webhook className="h-4 w-4 text-muted-foreground" />
              <span className="truncate w-full">{tenant._count?.webhooks || 0}</span>
              <span className="hig-caption-2 text-muted-foreground truncate w-full">Webhooks</span>
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
          <div className="hig-caption-2 text-muted-foreground space-y-1 min-w-0">
            <div className="flex justify-between gap-2 min-w-0">
              <span className="shrink-0">Tenant ID:</span>
              <span className="font-mono truncate">{tenant.id}</span>
            </div>
            <div className="flex justify-between gap-2 min-w-0">
              <span className="shrink-0">Clerk Org:</span>
              <span className="font-mono truncate">{tenant.clerkOrgId || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
