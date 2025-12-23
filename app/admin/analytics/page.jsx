"use client";

import Link from "next/link";
import { useAdminAnalytics } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function StatCard({ title, value, subtitle, icon: Icon, loading }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="hig-caption2 font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </span>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <>
            <div className="font-bold">{value}</div>
            {subtitle && (
              <span className="hig-caption2 text-muted-foreground">{subtitle}</span>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MiniBarChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-end gap-1 h-16 min-w-0">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="flex-1 h-8 min-w-5" />
        ))}
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-16 min-w-0 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center min-w-0">
          <div
            className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
            style={{
              height: `${Math.max((d.count / maxValue) * 100, 4)}%`,
              minHeight: "4px",
            }}
            title={`${d.label}: ${d.count}`}
          />
          <span className="hig-caption2 text-muted-foreground mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function TopTenantsList({ title, tenants, metric, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="hig-caption2 text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {tenants.slice(0, 5).map((tenant, i) => (
            <Link
              key={tenant.id}
              href={`/admin/tenants/${tenant.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="hig-caption2 font-medium text-muted-foreground w-4">
                  {i + 1}
                </span>
                <span className="hig-caption2 font-medium truncate">
                  {tenant.businessName || tenant.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hig-caption2 font-bold">{tenant._count[metric]}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentSignupsList({ signups, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Signups (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!signups || signups.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Signups (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="hig-caption2 text-muted-foreground">No recent signups</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="hig-body flex items-center gap-2">
          Recent Signups
          <Badge variant="secondary" className="hig-caption2">
            {signups.length} this week
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {signups.slice(0, 5).map((tenant) => (
            <Link
              key={tenant.id}
              href={`/admin/tenants/${tenant.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <div className="hig-caption2 font-medium truncate">
                  {tenant.businessName || tenant.name}
                </div>
                <div className="hig-caption2 text-muted-foreground truncate">
                  {tenant.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="hig-caption2 shrink-0"
                >
                  {tenant.subscriptionStatus === "trialing" ? "Trial" : tenant.subscriptionStatus}
                </Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanDistribution({ planBreakdown, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const plans = Object.entries(planBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const total = plans.reduce((sum, [, count]) => sum + count, 0);

  const colors = {
    platform: "bg-blue-500",
    professional: "bg-purple-500",
  };

  const labels = {
    platform: "Platform",
    professional: "Professional",
  };

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="hig-caption2 text-muted-foreground">No active subscriptions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Plan Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked bar */}
        <div className="h-4 rounded-full overflow-hidden flex mb-3">
          {plans.map(([plan, count]) => (
            <div
              key={plan}
              className={`${colors[plan] || "bg-gray-400"} transition-all`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${labels[plan] || plan}: ${count} (${Math.round((count / total) * 100)}%)`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {plans.map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${colors[plan] || "bg-gray-400"}`} />
              <span className="hig-caption2 text-muted-foreground">
                {labels[plan] || plan}
              </span>
              <span className="hig-caption2 font-medium ml-auto">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading: loading } = useAdminAnalytics();

  const overview = data?.overview || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Platform growth and performance
        </p>
      </div>

      {/* Platform Revenue - Main Metrics */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="hig-body font-medium">Platform Revenue</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-bold text-primary">
                  {formatCurrency(overview.currentMrr || 0)}
                </div>
                <p className="hig-caption2 text-muted-foreground">MRR (Monthly)</p>
              </div>
              <div>
                <div className="font-bold">
                  {formatCurrency(overview.currentArr || 0)}
                </div>
                <p className="hig-caption2 text-muted-foreground">ARR (Annual)</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={loading ? "..." : formatNumber(overview.totalTenants || 0)}
          icon={Building2}
          loading={loading}
        />
        <StatCard
          title="Active"
          value={loading ? "..." : overview.activeTenants || 0}
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          title="Conversion"
          value={loading ? "..." : `${overview.conversionRate || 0}%`}
          subtitle="trial → active"
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Trials"
          value={loading ? "..." : overview.trialTenants || 0}
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          title="Total Bookings"
          value={loading ? "..." : formatNumber(overview.totalBookings || 0)}
          icon={Calendar}
          loading={loading}
        />
        <StatCard
          title="Avg Bookings"
          value={loading ? "..." : overview.avgBookingsPerTenant || 0}
          subtitle="per tenant"
          icon={BarChart3}
          loading={loading}
        />
      </div>

      {/* Growth Charts */}
      <div className="grid gap-4 sm:grid-cols-2 min-w-0">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="hig-body flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tenant Growth (12mo)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <MiniBarChart data={charts.tenantGrowth || []} loading={loading} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="hig-body flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Booking Volume (12mo)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <MiniBarChart data={charts.bookingVolume || []} loading={loading} />
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <PlanDistribution planBreakdown={data?.planBreakdown} loading={loading} />

      {/* Recent Signups */}
      <RecentSignupsList signups={data?.recentSignups} loading={loading} />

      {/* Top Tenants */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TopTenantsList
          title="Top by Bookings"
          tenants={data?.topTenants?.byBookings}
          metric="bookings"
          loading={loading}
        />
        <TopTenantsList
          title="Top by Contacts"
          tenants={data?.topTenants?.byContacts}
          metric="contacts"
          loading={loading}
        />
      </div>

      {/* Tenant GMV Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Tenant GMV (All Time)</CardTitle>
          <p className="hig-caption2 text-muted-foreground">
            Total payments processed by tenants via Stripe Connect
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-bold">
                  {formatCurrency(overview.tenantGmv || 0)}
                </div>
                <p className="hig-caption2 text-muted-foreground">Total processed</p>
              </div>
              <div>
                <div className="font-bold">
                  {formatNumber(overview.tenantPaymentCount || 0)}
                </div>
                <p className="hig-caption2 text-muted-foreground">Payments</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
