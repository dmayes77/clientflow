"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function StatCard({ title, value, description, icon: Icon, trend, loading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="font-medium text-muted-foreground hig-caption1">
          {title}
        </CardTitle>
        <Icon className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        {loading ? (
          <Skeleton className="h-6 w-16 sm:h-8 sm:w-24" />
        ) : (
          <>
            <div className="font-bold">{value}</div>
            {description && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 hig-caption2">
                {trend !== undefined && (
                  <>
                    {trend > 0 ? (
                      <TrendingUp className="h-2.5 w-2.5 text-green-500 sm:h-3 sm:w-3" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-2.5 w-2.5 text-red-500 sm:h-3 sm:w-3" />
                    ) : null}
                    <span className={trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : ""}>
                      {trend > 0 ? "+" : ""}{trend}%
                    </span>
                  </>
                )}
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionBreakdown({ subscriptions, loading }) {
  const statusConfig = {
    active: { label: "Active", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
    trialing: { label: "Trial", icon: Clock, color: "bg-blue-100 text-blue-700" },
    past_due: { label: "Past Due", icon: AlertTriangle, color: "bg-yellow-100 text-yellow-700" },
    canceled: { label: "Canceled", icon: XCircle, color: "bg-red-100 text-red-700" },
    none: { label: "No Subscription", icon: XCircle, color: "bg-zinc-100 text-zinc-600" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
        <CardDescription>Breakdown of tenant subscription states</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(subscriptions || {}).map(([status, count]) => {
              const config = statusConfig[status] || statusConfig.none;
              const Icon = config.icon;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-semibold">Error loading dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage ClientFlow
          </p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/admin/tenants">
            View All Tenants
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={stats?.tenants?.total || 0}
          description={`${stats?.tenants?.thisMonth || 0} this month`}
          icon={Building2}
          trend={stats?.tenants?.growth}
          loading={loading}
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.tenants?.active || 0}
          description="paying customers"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          title="MRR"
          value={stats?.revenue?.mrr ? formatCurrency(stats.revenue.mrr) : "$0"}
          description="monthly recurring revenue"
          icon={DollarSign}
          loading={loading}
        />
        <StatCard
          title="Trials"
          value={stats?.tenants?.trial || 0}
          description="active trial accounts"
          icon={Clock}
          loading={loading}
        />
      </div>

      {/* Platform Activity */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          title="Total Bookings"
          value={stats?.bookings?.total?.toLocaleString() || 0}
          description={`${stats?.bookings?.thisMonth || 0} this month`}
          icon={Calendar}
          loading={loading}
        />
        <StatCard
          title="Total Contacts"
          value={stats?.contacts?.total?.toLocaleString() || 0}
          description="across all tenants"
          icon={Users}
          loading={loading}
        />
        <div className="col-span-2 lg:col-span-1">
          <SubscriptionBreakdown
            subscriptions={stats?.subscriptions}
            loading={loading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="outline" size="sm" asChild className="justify-start h-auto py-3">
              <Link href="/admin/tenants">
                <Building2 className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Tenants</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start h-auto py-3">
              <Link href="/admin/subscriptions">
                <DollarSign className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Subscriptions</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start h-auto py-3">
              <Link href="/admin/alerts">
                <AlertTriangle className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Alerts</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start h-auto py-3">
              <Link href="/admin/analytics">
                <TrendingUp className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
