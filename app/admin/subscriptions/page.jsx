"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminSubscriptions } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Calendar,
  ChevronRight,
  CreditCard,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  active: { label: "Active", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  trialing: { label: "Trial", icon: Clock, color: "bg-blue-100 text-blue-700" },
  past_due: { label: "Past Due", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-700" },
  canceled: { label: "Canceled", icon: XCircle, color: "bg-red-100 text-red-700" },
  incomplete: { label: "Incomplete", icon: AlertCircle, color: "bg-orange-100 text-orange-700" },
  none: { label: "None", icon: XCircle, color: "bg-zinc-100 text-zinc-600" },
};

const PLAN_CONFIG = {
  basic: { label: "Basic", color: "bg-zinc-100 text-zinc-700" },
  starter: { label: "Starter", color: "bg-emerald-100 text-emerald-700" },
  professional: { label: "Professional", color: "bg-purple-100 text-purple-700" },
  platform: { label: "Platform", color: "bg-blue-100 text-blue-700" },
  default: { label: "Unknown", color: "bg-zinc-100 text-zinc-600" },
};

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(date) {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, loading, variant }) {
  const variants = {
    default: "",
    success: "border-green-200 bg-green-50/50",
    warning: "border-yellow-200 bg-yellow-50/50",
    danger: "border-red-200 bg-red-50/50",
  };

  return (
    <Card className={variants[variant] || ""}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="hig-caption2 font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {loading ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <>
            <div className="hig-title-1 font-bold">{value}</div>
            {(subtitle || trend !== undefined) && (
              <div className="flex items-center gap-1 mt-0.5">
                {trend !== undefined && (
                  <>
                    {trend > 0 ? (
                      <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                    ) : null}
                    <span className={`hig-caption2 ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : ""}`}>
                      {trend > 0 ? "+" : ""}{trend}%
                    </span>
                  </>
                )}
                {subtitle && (
                  <span className="hig-caption2 text-muted-foreground">{subtitle}</span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatusFilter({ value, onChange, counts }) {
  const statuses = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "trialing", label: "Trial" },
    { value: "past_due", label: "Past Due" },
    { value: "canceled", label: "Canceled" },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3">
      {statuses.map((status) => {
        const count = status.value === "all"
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[status.value] || 0;

        return (
          <Button
            key={status.value}
            variant={value === status.value ? "default" : "outline"}
            size="sm"
            className="h-8 hig-caption2 shrink-0"
            onClick={() => onChange(status.value)}
          >
            {status.label}
            {count > 0 && (
              <span className="ml-1 hig-caption2 opacity-70">({count})</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

function TenantSubscriptionCard({ tenant }) {
  const statusConfig = STATUS_CONFIG[tenant.subscriptionStatus] || STATUS_CONFIG.none;
  const planConfig = PLAN_CONFIG[tenant.planType] || PLAN_CONFIG.default;
  const StatusIcon = statusConfig.icon;
  const days = daysUntil(tenant.currentPeriodEnd);

  const isAtRisk = tenant.subscriptionStatus === "past_due" ||
    (tenant.subscriptionStatus === "trialing" && days !== null && days <= 7);

  return (
    <Link href={`/admin/tenants/${tenant.id}`} className="block">
      <Card className={`hover:bg-muted/50 transition-colors active:bg-muted ${isAtRisk ? "border-yellow-300 bg-yellow-50/30" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium hig-body truncate">
                {tenant.businessName || tenant.name || "Unnamed"}
              </div>
              <div className="hig-caption2 text-muted-foreground truncate">
                {tenant.email}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`hig-caption2 ${statusConfig.color}`}>
                <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                {statusConfig.label}
              </Badge>
              <Badge variant="outline" className="hig-caption2">
                {planConfig.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 hig-caption2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {tenant._count?.bookings || 0} bookings
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />
              {tenant._count?.contacts || 0} contacts
            </div>
            {tenant.stripeSubscriptionId && (
              <div className="flex items-center gap-1 text-green-600">
                <CreditCard className="h-2.5 w-2.5" />
                Stripe
              </div>
            )}
          </div>

          {tenant.currentPeriodEnd && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-center justify-between hig-caption2">
                <span className="text-muted-foreground">
                  {tenant.subscriptionStatus === "trialing" ? "Trial ends" : "Renews"}
                </span>
                <span className={days !== null && days <= 7 ? "text-yellow-600 font-medium" : ""}>
                  {formatDate(tenant.currentPeriodEnd)}
                  {days !== null && days <= 7 && days >= 0 && (
                    <span className="ml-1">({days}d)</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function AtRiskSection({ tenants, loading }) {
  const atRiskTenants = tenants.filter(t => {
    if (t.subscriptionStatus === "past_due") return true;
    if (t.subscriptionStatus === "trialing") {
      const days = daysUntil(t.currentPeriodEnd);
      return days !== null && days <= 7;
    }
    return false;
  });

  if (loading || atRiskTenants.length === 0) return null;

  return (
    <Card className="border-yellow-300 bg-yellow-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="hig-body flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          At-Risk Accounts ({atRiskTenants.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {atRiskTenants.slice(0, 5).map((tenant) => (
            <Link
              key={tenant.id}
              href={`/admin/tenants/${tenant.id}`}
              className="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="font-medium hig-caption2 truncate">
                  {tenant.businessName || tenant.name}
                </div>
                <div className="hig-caption2 text-muted-foreground">
                  {tenant.subscriptionStatus === "past_due"
                    ? "Payment failed"
                    : `Trial ends ${formatDate(tenant.currentPeriodEnd)}`}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
          {atRiskTenants.length > 5 && (
            <Button variant="ghost" size="sm" className="w-full h-8 hig-caption2">
              View all {atRiskTenants.length} at-risk accounts
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanBreakdown({ planCounts, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="hig-body">Active by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const plans = Object.entries(planCounts).sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="hig-body">Active by Plan</CardTitle>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <p className="hig-caption2 text-muted-foreground">No active subscriptions</p>
        ) : (
          <div className="space-y-2">
            {plans.map(([plan, count]) => {
              const config = PLAN_CONFIG[plan] || PLAN_CONFIG.basic;
              const total = Object.values(planCounts).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={plan} className="flex items-center gap-3">
                  <Badge className={`hig-caption2 w-20 justify-center ${config.color}`}>
                    {config.label}
                  </Badge>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="hig-caption2 font-medium w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading: loading } = useAdminSubscriptions({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const tenants = data?.tenants || [];
  const stats = data?.stats || {};
  const statusBreakdown = data?.statusBreakdown || {};
  const planBreakdown = data?.planBreakdown || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="hig-title-1 font-bold">Subscriptions</h1>
        <p className="hig-body text-muted-foreground">
          Revenue and subscription management
        </p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          title="MRR"
          value={loading ? "..." : formatCurrency(stats.mrr || 0)}
          icon={DollarSign}
          loading={loading}
          variant="success"
        />
        <StatCard
          title="Active"
          value={loading ? "..." : stats.activeCount || 0}
          subtitle="paying"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          title="Past Due"
          value={loading ? "..." : stats.pastDueCount || 0}
          icon={AlertTriangle}
          loading={loading}
          variant={stats.pastDueCount > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Trials"
          value={loading ? "..." : stats.trialCount || 0}
          subtitle={stats.expiringTrials > 0 ? `${stats.expiringTrials} expiring` : "active"}
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* Monthly Activity */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          title="New"
          value={loading ? "..." : `+${stats.newThisMonth || 0}`}
          subtitle="this month"
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Canceled"
          value={loading ? "..." : stats.canceledThisMonth || 0}
          subtitle="this month"
          icon={XCircle}
          loading={loading}
          variant={stats.canceledThisMonth > 0 ? "danger" : "default"}
        />
        <StatCard
          title="Churn"
          value={loading ? "..." : `${stats.churnRate || 0}%`}
          icon={TrendingDown}
          loading={loading}
          variant={stats.churnRate > 5 ? "danger" : stats.churnRate > 2 ? "warning" : "default"}
        />
      </div>

      {/* At-Risk Section */}
      <AtRiskSection tenants={tenants} loading={loading} />

      {/* Plan Breakdown */}
      <PlanBreakdown planCounts={planBreakdown} loading={loading} />

      {/* Filter */}
      <StatusFilter
        value={statusFilter}
        onChange={setStatusFilter}
        counts={statusBreakdown}
      />

      {/* Tenant List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No subscriptions found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tenants.map((tenant) => (
            <TenantSubscriptionCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )}
    </div>
  );
}
