"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Search,
  CreditCard,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { usePayments } from "@/lib/hooks";

function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function StatusBadge({ status, disputeStatus }) {
  if (disputeStatus) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="size-3" />
        Disputed
      </Badge>
    );
  }

  switch (status) {
    case "succeeded":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Succeeded</Badge>;
    case "refunded":
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Refunded</Badge>;
    case "partial_refund":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Partial</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "disputed":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3" />
          Disputed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading: loading, refetch } = usePayments({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const payments = data?.payments || [];
  const stats = data?.stats || { totalRevenue: 0, paymentCount: 0 };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(search);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="hig-title-1">Payments</h1>
        <p className="hig-footnote text-muted-foreground">View and manage payment history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-green-600 dark:bg-green-700">
          <DollarSign className="size-5 text-green-100 mb-1" />
          <span className="block font-bold text-white">{formatPrice(stats.totalRevenue)}</span>
          <span className="hig-footnote text-green-100">Total Revenue</span>
        </div>
        <div className="p-4 rounded-xl bg-blue-600 dark:bg-blue-700">
          <Receipt className="size-5 text-blue-100 mb-1" />
          <span className="block font-bold text-white">{stats.paymentCount}</span>
          <span className="hig-footnote text-blue-100">Payments</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="icon" className="size-11 shrink-0">
            <Search className="size-4" />
          </Button>
        </form>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="partial_refund">Partial Refund</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="hig-footnote text-muted-foreground mt-2">Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="hig-headline mb-1">No payments found</h3>
          <p className="hig-footnote text-muted-foreground">
            {search || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Payments will appear here once customers start booking"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          {payments.map((payment, idx) => (
            <Link
              key={payment.id}
              href={`/dashboard/payments/${payment.id}`}
              className={`flex items-center gap-3 p-4 hover:bg-accent/50 active:bg-accent transition-colors ${
                idx !== payments.length - 1 ? "border-b" : ""
              }`}
            >
              {/* Avatar/Icon */}
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-medium text-primary">
                  {payment.clientName?.[0]?.toUpperCase() || "?"}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="hig-body font-medium truncate">{payment.clientName || "Unknown"}</p>
                  <StatusBadge status={payment.status} disputeStatus={payment.disputeStatus} />
                </div>
                <p className="hig-footnote text-muted-foreground truncate">
                  {payment.booking?.serviceName || payment.clientEmail}
                </p>
                <p className="hig-caption-1 text-muted-foreground mt-0.5">
                  {formatDate(payment.createdAt)}
                  {payment.cardBrand && payment.cardLast4 && (
                    <span> · {payment.cardBrand} •••• {payment.cardLast4}</span>
                  )}
                </p>
              </div>

              {/* Amount & Arrow */}
              <div className="text-right shrink-0">
                <p className="hig-body font-semibold text-green-600">{formatPrice(payment.amount)}</p>
                {payment.depositAmount && (
                  <p className="hig-caption-1 text-muted-foreground">deposit</p>
                )}
                {payment.refundedAmount > 0 && (
                  <p className="hig-caption-1 text-red-600">-{formatPrice(payment.refundedAmount)}</p>
                )}
              </div>
              <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
