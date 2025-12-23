"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminTenants } from "@/lib/hooks/use-admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  CreditCard,
} from "lucide-react";
import { Suspense } from "react";

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

function TenantCard({ tenant }) {
  return (
    <Link href={`/admin/tenants/${tenant.id}`} className="block">
      <Card className="hover:bg-muted/50 transition-colors active:bg-muted">
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
            <StatusBadge status={tenant.subscriptionStatus} size="sm" />
          </div>

          <div className="flex items-center gap-3 mt-2 hig-caption2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {tenant._count?.bookings || 0}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {tenant._count?.contacts || 0}
            </div>
            {tenant.stripeAccountId && (
              <div className="flex items-center gap-1 text-green-600">
                <CreditCard className="h-3 w-3" />
                <span>Connected</span>
              </div>
            )}
            <div className="ml-auto">
              {formatDate(tenant.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TenantsTableContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const { data, isLoading: loading } = useAdminTenants({
    search: search || undefined,
    status: status || undefined,
    limit: 20,
    offset: (page - 1) * 20,
  });

  const tenants = data?.tenants || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (updates.search !== undefined || updates.status !== undefined) {
      params.set("page", "1");
    }
    router.push(`/admin/tenants?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="hig-title-1 font-bold sm:hig-title-1">Tenants</h1>
        <p className="hig-body text-muted-foreground">
          {pagination.total} total tenants
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" size="sm" className="h-9">
            Search
          </Button>
        </form>
        <Select
          value={status || "all"}
          onValueChange={(value) => updateParams({ status: value === "all" ? "" : value })}
        >
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenant List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tenants found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="hig-caption2 text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: (page - 1).toString() })}
              disabled={page <= 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: (page + 1).toString() })}
              disabled={page >= pagination.totalPages}
              className="h-8 px-2"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TenantsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div>
          <Skeleton className="h-7 w-24 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    }>
      <TenantsTableContent />
    </Suspense>
  );
}
