"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DollarSign,
  Search,
  CreditCard,
  ChevronRight,
  RefreshCw,
  Receipt,
  Download,
  Calendar,
  X,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { usePayments, useExportPayments } from "@/lib/hooks";
import { formatCurrency } from "@/lib/formatters";
import { PaymentStatusBadge } from "@/components/ui/status-badge";
import { LoadingCard } from "@/components/ui/loading-card";

const ITEMS_PER_PAGE = 20;

function formatDateTime(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  if (startDate) return `From ${formatDate(startDate)}`;
  if (endDate) return `Until ${formatDate(endDate)}`;
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const exportMutation = useExportPayments();

  const { data, isLoading: loading, refetch } = usePayments({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: ITEMS_PER_PAGE,
    offset: page * ITEMS_PER_PAGE,
  });

  const payments = data?.payments || [];
  const total = data?.total || 0;
  const stats = data?.stats || { totalRevenue: 0, paymentCount: 0 };
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(0);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(0);
  };

  const handleApplyDateFilter = () => {
    setDatePopoverOpen(false);
    setPage(0);
  };

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setDatePopoverOpen(false);
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync({
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Payments exported successfully");
    } catch (error) {
      toast.error(error.message || "Failed to export payments");
    }
  };

  const dateRangeLabel = formatDateRange(startDate, endDate);
  const hasActiveFilters = statusFilter !== "all" || searchQuery || startDate || endDate;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="hig-title-1">Payments</h1>
          <p className="hig-footnote text-muted-foreground">View and manage payment history</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="shrink-0"
        >
          {exportMutation.isPending ? (
            <Loader2 className="size-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="size-4 mr-1.5" />
          )}
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="size-4 text-green-600" />
            <span className="hig-footnote text-muted-foreground">Total Revenue</span>
          </div>
          <span className="block text-xl font-bold">{formatCurrency(stats.totalRevenue)}</span>
        </div>
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="size-4 text-blue-600" />
            <span className="hig-footnote text-muted-foreground">Payments</span>
          </div>
          <span className="block text-xl font-bold">{stats.paymentCount}</span>
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

        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="flex-1 min-w-35">
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

          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={dateRangeLabel ? "secondary" : "outline"}
                className={cn("flex-1 min-w-35 justify-start", dateRangeLabel && "pr-2")}
              >
                <Calendar className="size-4 mr-2 shrink-0" />
                <span className="truncate">{dateRangeLabel || "Date Range"}</span>
                {dateRangeLabel && (
                  <X
                    className="size-4 ml-auto shrink-0 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDateFilter();
                    }}
                  />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">From</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">To</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleClearDateFilter}>
                    Clear
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleApplyDateFilter}>
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" className="size-11 shrink-0" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <LoadingCard message="Loading payments..." size="lg" card={false} />
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="hig-headline mb-1">No payments found</h3>
          <p className="hig-footnote text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters"
              : "Payments will appear here once customers start booking"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border bg-card overflow-hidden">
            {payments.map((payment, idx) => (
              <Link
                key={payment.id}
                href={`/dashboard/payments/${payment.id}`}
                className={cn(
                  "flex items-center gap-3 p-4 hover:bg-accent/50 active:bg-accent transition-colors",
                  idx !== payments.length - 1 && "border-b"
                )}
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
                    <PaymentStatusBadge status={payment.status} disputeStatus={payment.disputeStatus} />
                  </div>
                  <p className="hig-footnote text-muted-foreground truncate">
                    {payment.booking?.serviceName || payment.clientEmail}
                  </p>
                  <p className="hig-caption-1 text-muted-foreground mt-0.5">
                    {formatDateTime(payment.createdAt)}
                    {payment.cardBrand && payment.cardLast4 && (
                      <span> · {payment.cardBrand} •••• {payment.cardLast4}</span>
                    )}
                  </p>
                </div>

                {/* Amount & Arrow */}
                <div className="text-right shrink-0">
                  <p className="hig-body font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                  {payment.depositAmount && (
                    <p className="hig-caption-1 text-muted-foreground">deposit</p>
                  )}
                  {payment.refundedAmount > 0 && (
                    <p className="hig-caption-1 text-red-600">-{formatCurrency(payment.refundedAmount)}</p>
                  )}
                </div>
                <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="hig-footnote text-muted-foreground">
                Showing {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
