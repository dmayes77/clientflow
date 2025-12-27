"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useInvoices,
  useUpdateInvoice,
  useDeleteInvoice,
  useSendInvoice,
  useDownloadInvoicePDF,
  useTags,
} from "@/lib/hooks";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PreviewSheet,
  PreviewSheetContent,
  PreviewSheetSection,
} from "@/components/ui/preview-sheet";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { TagFilter } from "@/components/ui/tag-filter";
import { Percent, DollarSign, CreditCard, Send, Pencil, Trash2, Download, User, Calendar, Clock, FileCheck, Ticket, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoneyIcon,
  AddIcon,
  LoadingIcon,
  InvoiceIcon,
  SendIcon,
  CompleteIcon,
  PendingIcon,
  WarningIcon,
  ViewIcon,
  CloseIcon,
  DownloadIcon,
} from "@/lib/icons";

const statusConfig = {
  draft: { label: "Draft", variant: "secondary", icon: InvoiceIcon },
  sent: { label: "Sent", variant: "info", icon: SendIcon },
  viewed: { label: "Viewed", variant: "default", icon: ViewIcon },
  paid: { label: "Paid", variant: "success", icon: CompleteIcon },
  overdue: { label: "Overdue", variant: "destructive", icon: WarningIcon },
  cancelled: { label: "Cancelled", variant: "secondary", icon: CloseIcon },
};

// Safe deposit percent parser
const getSafeDepositPercent = (value) => {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return (!isNaN(parsed) && parsed > 0) ? parsed : 0;
};

// Safe deposit amount getter
const getSafeDepositAmount = (invoice) => {
  if (!invoice) return 0;
  const depositAmount = invoice.depositAmount;
  if (depositAmount === null || depositAmount === undefined) {
    const percent = getSafeDepositPercent(invoice.depositPercent);
    const total = (typeof invoice.total === 'number' && !isNaN(invoice.total)) ? invoice.total : 0;
    return Math.round(total * (percent / 100));
  }
  const parsed = typeof depositAmount === 'number' ? depositAmount : parseFloat(depositAmount);
  return (!isNaN(parsed) && isFinite(parsed) && parsed >= 0) ? parsed : 0;
};

// Safe lineItems parser - handles JSON string or array
const getSafeLineItems = (lineItems) => {
  if (!lineItems) return [];
  if (Array.isArray(lineItems)) return lineItems;
  if (typeof lineItems === 'string') {
    try {
      const parsed = JSON.parse(lineItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const getTagColorClass = (color) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    pink: "bg-pink-100 text-pink-800 border-pink-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colorMap[color] || colorMap.gray;
};

const formatPrice = (cents) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

export function InvoicesList() {
  const router = useRouter();

  // TanStack Query hooks
  const { data: invoices = [], isLoading: loading } = useInvoices();
  const { data: allTags = [] } = useTags("all");
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const sendInvoice = useSendInvoice();
  const downloadInvoicePDF = useDownloadInvoicePDF();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, isDeposit: false, depositPercent: null });
  const [sendingId, setSendingId] = useState(null);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  const handleStatusChange = (invoice, newStatus) => {
    // Validate state transitions
    if (invoice.status === "draft" && newStatus === "paid") {
      toast.error("Cannot mark draft invoice as paid. Send it first.");
      return;
    }

    // Prepare update data based on status
    const updateData = { id: invoice.id, status: newStatus };

    // If marking as paid, include payment data
    if (newStatus === "paid") {
      updateData.amountPaid = invoice.total;
      updateData.balanceDue = 0;
      updateData.paidAt = new Date().toISOString();
    }

    updateInvoice.mutate(updateData, {
      onSuccess: () => {
        toast.success(`Invoice marked as ${newStatus}`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update invoice status");
      },
    });
  };

  const handleOpenPaymentDialog = (invoice) => {
    setInvoiceForPayment(invoice);
    const safeTotal = (typeof invoice.total === 'number' && !isNaN(invoice.total)) ? invoice.total : 0;
    const safeAmountPaid = (typeof invoice.amountPaid === 'number' && !isNaN(invoice.amountPaid)) ? invoice.amountPaid : 0;
    const balanceDue = invoice.balanceDue || safeTotal - safeAmountPaid;
    const depositPercent = getSafeDepositPercent(invoice.depositPercent);
    const hasDeposit = depositPercent > 0 && !invoice.depositPaidAt;
    const depositAmount = getSafeDepositAmount(invoice);
    setPaymentData({
      amount: hasDeposit ? depositAmount / 100 : balanceDue / 100,
      isDeposit: hasDeposit,
      depositPercent: hasDeposit ? depositPercent : null,
    });
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!invoiceForPayment) return;

    const amountInCents = Math.round(paymentData.amount * 100);
    const currentAmountPaid = invoiceForPayment.amountPaid || 0;
    const newAmountPaid = currentAmountPaid + amountInCents;
    const totalAmount = invoiceForPayment.total;
    const newBalanceDue = totalAmount - newAmountPaid;
    const isPaidInFull = newBalanceDue <= 0;

    const updateData = {
      id: invoiceForPayment.id,
      amountPaid: newAmountPaid,
      balanceDue: Math.max(0, newBalanceDue),
      ...(paymentData.isDeposit && { depositPaidAt: new Date().toISOString() }),
      ...(isPaidInFull && { status: "paid", paidAt: new Date().toISOString() }),
    };

    updateInvoice.mutate(updateData, {
      onSuccess: () => {
        toast.success(paymentData.isDeposit ? "Deposit recorded" : isPaidInFull ? "Invoice marked as paid" : "Payment recorded");
        setPaymentDialogOpen(false);
        setInvoiceForPayment(null);
      },
      onError: () => {
        toast.error("Failed to record payment");
      },
    });
  };

  const handleDelete = () => {
    if (!invoiceToDelete) return;

    deleteInvoice.mutate(invoiceToDelete.id, {
      onSuccess: () => {
        toast.success("Invoice deleted");
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
      },
      onError: () => {
        toast.error("Failed to delete invoice");
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
      },
    });
  };

  const handleDownload = (invoice) => {
    downloadInvoicePDF.mutate(
      { id: invoice.id, invoiceNumber: invoice.invoiceNumber },
      {
        onError: () => {
          toast.error("Failed to download invoice PDF");
        },
      }
    );
  };

  const handleSend = (invoice) => {
    setSendingId(invoice.id);
    sendInvoice.mutate(invoice.id, {
      onSuccess: (data) => {
        toast.success("Invoice sent successfully");
        if (data.warning) {
          toast.warning(data.warning);
        }
        setSendingId(null);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send invoice");
        setSendingId(null);
      },
    });
  };

  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === "paid");
    const pendingInvoices = invoices.filter((i) => ["sent", "viewed"].includes(i.status));
    const overdueInvoices = invoices.filter((i) => i.status === "overdue");

    return {
      total: invoices.length,
      paid: paidInvoices.length,
      pending: pendingInvoices.length,
      overdue: overdueInvoices.length,
      totalRevenue: paidInvoices.reduce((sum, i) => sum + i.total, 0),
      outstandingAmount: [...pendingInvoices, ...overdueInvoices].reduce((sum, i) => sum + (i.balanceDue || i.total), 0),
    };
  }, [invoices]);

  // Tag helper functions
  const hasTag = (invoice, tagName) => {
    if (!invoice.tags) return false;
    return invoice.tags.some((t) => t.tag.name.toLowerCase() === tagName.toLowerCase());
  };

  const hasAnyStatusTag = (invoice) => {
    if (!invoice.tags) return false;
    const statusTagNames = ["Draft", "Sent", "Viewed", "Paid", "Overdue", "Cancelled"];
    return invoice.tags.some((t) => statusTagNames.includes(t.tag.name));
  };

  // Filtered invoices based on status filter and tag filter
  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Tag-based status filter (status pills)
    if (statusFilter !== "all") {
      if (statusFilter === "unclassified") {
        result = result.filter((inv) => !hasAnyStatusTag(inv));
      } else {
        result = result.filter((inv) => hasTag(inv, statusFilter));
      }
    }

    // Additional tag filter (non-status tags via TagFilter component)
    if (selectedTagIds.length > 0) {
      result = result.filter((invoice) =>
        invoice.tags?.some((tagAssoc) => selectedTagIds.includes(tagAssoc.tag.id))
      );
    }

    return result;
  }, [invoices, statusFilter, selectedTagIds]);

  // Count by status tags
  const statusCounts = useMemo(() => {
    return {
      all: invoices.length,
      draft: invoices.filter((i) => hasTag(i, "Draft")).length,
      sent: invoices.filter((i) => hasTag(i, "Sent")).length,
      viewed: invoices.filter((i) => hasTag(i, "Viewed")).length,
      paid: invoices.filter((i) => hasTag(i, "Paid")).length,
      overdue: invoices.filter((i) => hasTag(i, "Overdue")).length,
      cancelled: invoices.filter((i) => hasTag(i, "Cancelled")).length,
      unclassified: invoices.filter((i) => !hasAnyStatusTag(i)).length,
    };
  }, [invoices]);

  // Bulk action handlers
  const [selectedRows, setSelectedRows] = useState({});

  const handleBulkMarkPaid = (selectedInvoices) => {
    // Filter out draft invoices - they must be sent first
    const validInvoices = selectedInvoices.filter(inv => inv.status !== "draft");
    const skippedCount = selectedInvoices.length - validInvoices.length;

    if (validInvoices.length === 0) {
      toast.error("Cannot mark draft invoices as paid. Send them first.");
      return;
    }

    const updates = validInvoices.map((invoice) =>
      updateInvoice.mutateAsync({
        id: invoice.id,
        status: "paid",
        amountPaid: invoice.total,
        balanceDue: 0,
        paidAt: new Date().toISOString(),
      })
    );

    Promise.all(updates)
      .then(() => {
        const message = skippedCount > 0
          ? `${validInvoices.length} invoice(s) marked as paid. ${skippedCount} draft invoice(s) skipped.`
          : `${validInvoices.length} invoice(s) marked as paid`;
        toast.success(message);
        setSelectedRows({});
      })
      .catch((error) => {
        toast.error(error.message || "Failed to update some invoices");
      });
  };

  const handleBulkMarkUnpaid = (selectedInvoices) => {
    const updates = selectedInvoices.map((invoice) =>
      updateInvoice.mutateAsync({
        id: invoice.id,
        status: "sent",
        amountPaid: 0,
        balanceDue: invoice.total,
        paidAt: null,
        depositPaidAt: null,
      })
    );

    Promise.all(updates)
      .then(() => {
        toast.success(`${selectedInvoices.length} invoice(s) marked as unpaid`);
        setSelectedRows({});
      })
      .catch(() => {
        toast.error("Failed to update some invoices");
      });
  };

  const handleBulkDelete = (selectedInvoices) => {
    const deletes = selectedInvoices.map((invoice) =>
      deleteInvoice.mutateAsync(invoice.id)
    );

    Promise.all(deletes)
      .then(() => {
        toast.success(`${selectedInvoices.length} invoice(s) deleted`);
        setSelectedRows({});
      })
      .catch(() => {
        toast.error("Failed to delete some invoices");
      });
  };

  // Bulk tag operations
  const handleBulkAddTag = async (tagId, selectedInvoices) => {
    if (selectedInvoices.length === 0 || !tagId) return;

    try {
      const addPromises = selectedInvoices.map(async (invoice) => {
        const response = await fetch(`/api/invoices/${invoice.id}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId }),
        });
        if (!response.ok) {
          const error = await response.json();
          // Ignore "already exists" errors silently
          if (!error.error?.includes("already added")) {
            throw new Error(error.error || "Failed to add tag");
          }
        }
      });
      await Promise.all(addPromises);
      toast.success(`Tag added to ${selectedInvoices.length} invoice(s)`);
      setSelectedRows({});
      // Refresh data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to add tag to some invoices");
    }
  };

  const handleBulkRemoveTag = async (tagId, selectedInvoices) => {
    if (selectedInvoices.length === 0 || !tagId) return;

    try {
      const removePromises = selectedInvoices.map(async (invoice) => {
        const response = await fetch(`/api/invoices/${invoice.id}/tags?tagId=${tagId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to remove tag");
        }
      });
      await Promise.all(removePromises);
      toast.success(`Tag removed from ${selectedInvoices.length} invoice(s)`);
      setSelectedRows({});
      // Refresh data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to remove tag from some invoices");
    }
  };

  // Define columns for DataTable
  const columns = [
    {
      id: "select",
      size: 40,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invoice" />
      ),
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPreviewInvoice(row.original);
            setPreviewSheetOpen(true);
          }}
          className="font-medium text-primary hover:underline cursor-pointer"
        >
          {row.original.invoiceNumber}
        </button>
      ),
    },
    {
      accessorKey: "contactName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Client" />
      ),
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.contactName}</p>
          <p className="hig-caption2 text-muted-foreground">{row.original.contactEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <PendingIcon className="h-3.5 w-3.5" />
          {format(new Date(row.original.dueDate), "MMM d, yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{formatPrice(row.original.total)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <Badge variant={statusConfig[row.original.status]?.variant || "secondary"}>
          {statusConfig[row.original.status]?.label || row.original.status}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <Card className="py-4">
        <CardContent className="flex items-center justify-center py-12">
          <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 mb-4 sm:mb-6">
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <p className="hig-caption2 text-muted-foreground mb-1 sm:mb-2">Total Collected</p>
          <div className="font-bold">{formatPrice(stats.totalRevenue)}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <p className="hig-caption2 text-muted-foreground mb-1 sm:mb-2">Outstanding</p>
          <div className="font-bold">{formatPrice(stats.outstandingAmount)}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <p className="hig-caption2 text-muted-foreground mb-1 sm:mb-2">Paid Invoices</p>
          <div className="font-bold">{stats.paid}</div>
        </div>
        <div className="rounded-lg border bg-card p-3 sm:p-4">
          <p className="hig-caption2 text-muted-foreground mb-1 sm:mb-2">Overdue</p>
          <div className="font-bold text-destructive">{stats.overdue}</div>
        </div>
      </div>

      <Card className="p-3 sm:p-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 mb-3 sm:mb-4">
          <div>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <MoneyIcon className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              Invoices
            </CardTitle>
            <p className="mt-1 sm:mt-2 text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </p>
          </div>
          {invoices.length > 0 && (
            <Button size="sm" onClick={() => router.push("/dashboard/invoices/new")}>
              <AddIcon className="h-4 w-4 mr-1" />
              Create Invoice
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <InvoiceIcon className="h-6 w-6 text-success" />
              </div>
              <h3 className="mb-3">No invoices yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first invoice to track payments
              </p>
              <Button size="sm" onClick={() => router.push("/dashboard/invoices/new")}>
                <AddIcon className="h-4 w-4 mr-1" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <>
              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>
                  All ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("draft")}
                  className={`${statusFilter === "draft" ? "bg-slate-500 hover:bg-slate-600" : ""}`}
                >
                  Draft ({statusCounts.draft})
                </Button>
                <Button
                  variant={statusFilter === "sent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("sent")}
                  className={`${statusFilter === "sent" ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                >
                  Sent ({statusCounts.sent})
                </Button>
                <Button
                  variant={statusFilter === "viewed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("viewed")}
                >
                  Viewed ({statusCounts.viewed})
                </Button>
                <Button
                  variant={statusFilter === "paid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("paid")}
                  className={`${statusFilter === "paid" ? "bg-green-500 hover:bg-green-600" : ""}`}
                >
                  Paid ({statusCounts.paid})
                </Button>
                <Button
                  variant={statusFilter === "overdue" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("overdue")}
                  className={`${statusFilter === "overdue" ? "bg-red-500 hover:bg-red-600" : ""}`}
                >
                  Overdue ({statusCounts.overdue})
                </Button>
                <Button
                  variant={statusFilter === "cancelled" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("cancelled")}
                >
                  Cancelled ({statusCounts.cancelled})
                </Button>
                <Button
                  variant={statusFilter === "unclassified" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("unclassified")}
                  className={`${statusFilter === "unclassified" ? "bg-slate-500 hover:bg-slate-600" : ""}`}
                >
                  Unclassified ({statusCounts.unclassified})
                </Button>

                {/* Additional Tag Filter */}
                <div className="ml-auto">
                  <TagFilter
                    tags={allTags}
                    selectedTagIds={selectedTagIds}
                    onSelectionChange={setSelectedTagIds}
                    type="invoice"
                    excludeSystemTags={true}
                    placeholder="Filter by tags"
                  />
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredInvoices}
                searchPlaceholder="Search invoices..."
                pageSize={25}
                onRowClick={(invoice) => {
                  setPreviewInvoice(invoice);
                  setPreviewSheetOpen(true);
                }}
                emptyMessage="No invoices found."
              toolbar={({ table }) => {
                const selectedInvoices = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
                const hasSelection = selectedInvoices.length > 0;

                if (!hasSelection) return null;

                return (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
                    <span className="text-sm font-medium">
                      {selectedInvoices.length} selected
                    </span>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleBulkMarkPaid(selectedInvoices)}
                      disabled={updateInvoice.isPending}
                    >
                      <Check className="h-4 w-4 mr-1 text-green-600" />
                      Mark Paid
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => handleBulkMarkUnpaid(selectedInvoices)}
                      disabled={updateInvoice.isPending}
                    >
                      <CreditCard className="h-4 w-4 mr-1 text-amber-600" />
                      Mark Unpaid
                    </Button>

                    <Select onValueChange={(tagId) => handleBulkAddTag(tagId, selectedInvoices)}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue placeholder="Add tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTags
                          .filter((tag) => tag.type === "invoice" || tag.type === "general")
                          .filter((tag) => !tag.isSystem)
                          .map((tag) => (
                            <SelectItem key={tag.id} value={tag.id}>
                              {tag.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Select onValueChange={(tagId) => handleBulkRemoveTag(tagId, selectedInvoices)}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue placeholder="Remove tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {allTags
                          .filter((tag) => tag.type === "invoice" || tag.type === "general")
                          .filter((tag) => !tag.isSystem)
                          .map((tag) => (
                            <SelectItem key={tag.id} value={tag.id}>
                              {tag.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => handleBulkDelete(selectedInvoices)}
                      disabled={deleteInvoice.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => table.resetRowSelection()}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              }}
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {invoiceToDelete?.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record a payment for {invoiceForPayment?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {invoiceForPayment && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-medium">{formatPrice(invoiceForPayment.total)}</span>
                </div>
                {(invoiceForPayment.amountPaid || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid</span>
                    <span>{formatPrice(invoiceForPayment.amountPaid || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Balance Due</span>
                  <span>{formatPrice(invoiceForPayment.balanceDue || invoiceForPayment.total - (invoiceForPayment.amountPaid || 0))}</span>
                </div>
              </div>

              {getSafeDepositPercent(invoiceForPayment.depositPercent) > 0 && !invoiceForPayment.depositPaidAt && (
                <div className="space-y-2">
                  <Label className="font-medium">Payment Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={paymentData.isDeposit ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setPaymentData({
                        ...paymentData,
                        isDeposit: true,
                        amount: getSafeDepositAmount(invoiceForPayment) / 100,
                      })}
                    >
                      <Percent className="h-4 w-4 mr-1" />
                      Deposit ({getSafeDepositPercent(invoiceForPayment.depositPercent)}%)
                    </Button>
                    <Button
                      type="button"
                      variant={!paymentData.isDeposit ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setPaymentData({
                        ...paymentData,
                        isDeposit: false,
                        amount: (invoiceForPayment.balanceDue || invoiceForPayment.total) / 100,
                      })}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Full / Custom
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">$</span>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    className="flex-1"
                  />
                </div>
                {paymentData.isDeposit && (
                  <p className="hig-caption2 text-muted-foreground">
                    Deposit: {getSafeDepositPercent(invoiceForPayment.depositPercent)}% of {formatPrice(invoiceForPayment.total)}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={updateInvoice.isPending || paymentData.amount <= 0}>
              {updateInvoice.isPending && <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Sheet */}
      {previewInvoice && (
        <PreviewSheet
          open={previewSheetOpen}
          onOpenChange={setPreviewSheetOpen}
          title={previewInvoice?.invoiceNumber || "Invoice Preview"}
          scrollable
          actionColumns={getSafeDepositPercent(previewInvoice.depositPercent) > 0 ? 6 : 5}
          header={
            <div className="flex items-center justify-between">
              <h3 className="hig-headline">{previewInvoice.invoiceNumber}</h3>
              <Badge variant={statusConfig[previewInvoice.status]?.variant || "secondary"}>
                {statusConfig[previewInvoice.status]?.label || previewInvoice.status}
              </Badge>
            </div>
          }
          actions={
            <>
              {/* Action 1: Send (if draft) or Pay (if sent/viewed/overdue) */}
              {previewInvoice.status === "draft" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0"
                  disabled={sendingId === previewInvoice.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSheetOpen(false);
                    handleSend(previewInvoice);
                  }}
                >
                  <Send className="h-5 w-5" />
                  <span className="hig-caption-2">Send</span>
                </Button>
              ) : ["sent", "viewed", "overdue"].includes(previewInvoice.status) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSheetOpen(false);
                    handleOpenPaymentDialog(previewInvoice);
                  }}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="hig-caption-2">Pay</span>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 opacity-50" disabled>
                  <CreditCard className="h-5 w-5" />
                  <span className="hig-caption-2">Pay</span>
                </Button>
              )}

              {/* Action 2: Download PDF */}
              <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0"
                disabled={downloadInvoicePDF.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(previewInvoice);
                }}
              >
                <Download className="h-5 w-5" />
                <span className="hig-caption-2">PDF</span>
              </Button>

              {/* Action 3: Toggle Payment Status */}
              {previewInvoice.status === "paid" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 text-amber-600 hover:text-amber-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Reset to sent status and clear payment fields
                    updateInvoice.mutate({
                      id: previewInvoice.id,
                      status: "sent",
                      amountPaid: 0,
                      balanceDue: previewInvoice.total,
                      paidAt: null,
                      depositPaidAt: null,
                    }, {
                      onSuccess: () => {
                        toast.success("Invoice marked as unpaid");
                        setPreviewSheetOpen(false);
                      },
                      onError: () => {
                        toast.error("Failed to update invoice");
                      },
                    });
                  }}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="hig-caption-2">Unpaid</span>
                </Button>
              ) : ["sent", "viewed", "overdue"].includes(previewInvoice.status) ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 text-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSheetOpen(false);
                    handleStatusChange(previewInvoice, "paid");
                  }}
                >
                  <CompleteIcon className="h-5 w-5" />
                  <span className="hig-caption-2">Paid</span>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 opacity-50" disabled>
                  <CompleteIcon className="h-5 w-5" />
                  <span className="hig-caption-2">Paid</span>
                </Button>
              )}

              {/* Action 4: Toggle Deposit (if has deposit) */}
              {getSafeDepositPercent(previewInvoice.depositPercent) > 0 && (
                previewInvoice.depositPaidAt ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateInvoice.mutate({
                        id: previewInvoice.id,
                        depositPaidAt: null,
                      }, {
                        onSuccess: () => {
                          toast.success("Deposit marked as unpaid");
                        },
                        onError: () => {
                          toast.error("Failed to update deposit status");
                        },
                      });
                    }}
                  >
                    <Percent className="h-5 w-5" />
                    <span className="hig-caption-2">Dep.Unpaid</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 text-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateInvoice.mutate({
                        id: previewInvoice.id,
                        depositPaidAt: new Date().toISOString(),
                      }, {
                        onSuccess: () => {
                          toast.success("Deposit marked as paid");
                        },
                        onError: () => {
                          toast.error("Failed to update deposit status");
                        },
                      });
                    }}
                  >
                    <Percent className="h-5 w-5" />
                    <span className="hig-caption-2">Dep.Paid</span>
                  </Button>
                )
              )}

              {/* Action 5: Edit */}
              <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewSheetOpen(false);
                  router.push(`/dashboard/invoices/${previewInvoice.id}`);
                }}
              >
                <Pencil className="h-5 w-5" />
                <span className="hig-caption-2">Edit</span>
              </Button>

              {/* Action 6: Delete */}
              <Button
                variant="ghost"
                size="sm"
                className="flex-col h-auto py-2 gap-0.5 focus-visible:ring-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewSheetOpen(false);
                  setInvoiceToDelete(previewInvoice);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-5 w-5" />
                <span className="hig-caption-2">Delete</span>
              </Button>
            </>
          }
        >
          <PreviewSheetContent className="space-y-4">
            {/* Contact Info */}
            <PreviewSheetSection className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                <User className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="hig-subheadline font-medium truncate">{previewInvoice.contactName}</p>
                <p className="hig-footnote text-muted-foreground truncate">{previewInvoice.contactEmail}</p>
                {previewInvoice.contactAddress && (
                  <p className="hig-caption-2 text-muted-foreground truncate">{previewInvoice.contactAddress}</p>
                )}
              </div>
            </PreviewSheetSection>

            <Separator />

            {/* Dates */}
            <PreviewSheetSection className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <p className="hig-caption-2 text-muted-foreground">Issue Date</p>
                  <p className="hig-footnote font-medium">{format(new Date(previewInvoice.issueDate || previewInvoice.createdAt), "MMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <div>
                  <p className="hig-caption-2 text-muted-foreground">Due Date</p>
                  <p className="hig-footnote font-medium">{format(new Date(previewInvoice.dueDate), "MMM d, yyyy")}</p>
                </div>
              </div>
              {previewInvoice.sentAt && (
                <div className="flex items-center gap-2">
                  <Send className="size-4 text-muted-foreground" />
                  <div>
                    <p className="hig-caption-2 text-muted-foreground">Sent</p>
                    <p className="hig-footnote font-medium">{format(new Date(previewInvoice.sentAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              )}
              {previewInvoice.paidAt && (
                <div className="flex items-center gap-2">
                  <FileCheck className="size-4 text-green-600" />
                  <div>
                    <p className="hig-caption-2 text-muted-foreground">Paid</p>
                    <p className="hig-footnote font-medium text-green-600">{format(new Date(previewInvoice.paidAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              )}
            </PreviewSheetSection>

            <Separator />

            {/* Line Items */}
            <PreviewSheetSection>
              <h4 className="hig-subheadline font-semibold mb-2">Line Items</h4>
              <div className="space-y-2">
                {getSafeLineItems(previewInvoice.lineItems)
                  .filter(item => !item.description?.toLowerCase().includes('deposit'))
                  .map((item, index) => (
                  <div key={index} className={`flex justify-between items-start hig-footnote ${item.isDiscount ? "text-red-600" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.description || "Item"}</p>
                      {item.quantity > 1 && (
                        <p className="hig-caption-2 text-muted-foreground">
                          {item.quantity} × {formatPrice(item.unitPrice)}
                        </p>
                      )}
                    </div>
                    <span className="font-medium ml-2">
                      {item.isDiscount ? "-" : ""}{formatPrice(Math.abs(item.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </PreviewSheetSection>

            <Separator />

            {/* Financial Summary */}
            <PreviewSheetSection className="space-y-2">
              <div className="flex justify-between hig-footnote">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(previewInvoice.subtotal)}</span>
              </div>
              {(previewInvoice.discountAmount || 0) > 0 && (
                <div className="flex justify-between hig-footnote text-red-600">
                  <span>Discount {previewInvoice.discountCode ? `(${previewInvoice.discountCode})` : ""}</span>
                  <span>-{formatPrice(previewInvoice.discountAmount)}</span>
                </div>
              )}
              {/* Coupons */}
              {previewInvoice.coupons?.length > 0 && previewInvoice.coupons.map((invoiceCoupon) => (
                <div key={invoiceCoupon.id} className="flex justify-between hig-footnote text-green-600">
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3 w-3" />
                    Coupon ({invoiceCoupon.coupon?.code || "Applied"})
                  </span>
                  <span>-{formatPrice(invoiceCoupon.calculatedAmount)}</span>
                </div>
              ))}
              {(previewInvoice.taxAmount || 0) > 0 && (
                <div className="flex justify-between hig-footnote">
                  <span className="text-muted-foreground">Tax ({previewInvoice.taxRate}%)</span>
                  <span>{formatPrice(previewInvoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between hig-subheadline font-semibold pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(previewInvoice.total)}</span>
              </div>

              {/* Deposit */}
              {getSafeDepositPercent(previewInvoice.depositPercent) > 0 && (
                <div className="flex justify-between hig-footnote pt-2 border-t">
                  <span className={previewInvoice.depositPaidAt ? "text-green-600" : "text-blue-600"}>
                    {previewInvoice.depositPaidAt ? "✓ Deposit Paid" : `Deposit Due (${getSafeDepositPercent(previewInvoice.depositPercent)}%)`}
                  </span>
                  <span className={previewInvoice.depositPaidAt ? "text-green-600" : "text-blue-600"}>
                    {formatPrice(getSafeDepositAmount(previewInvoice))}
                  </span>
                </div>
              )}

              {/* Balance Due */}
              {(previewInvoice.balanceDue || 0) > 0 && previewInvoice.status !== "paid" && (
                <div className="flex justify-between hig-subheadline font-medium pt-2 border-t">
                  <span>Balance Due</span>
                  <span>{formatPrice(previewInvoice.balanceDue)}</span>
                </div>
              )}
            </PreviewSheetSection>

            {/* Notes */}
            {previewInvoice.notes && (
              <>
                <Separator />
                <PreviewSheetSection>
                  <h4 className="hig-subheadline font-semibold mb-1">Notes</h4>
                  <p className="hig-footnote text-muted-foreground whitespace-pre-wrap">{previewInvoice.notes}</p>
                </PreviewSheetSection>
              </>
            )}

            {/* Terms */}
            {previewInvoice.terms && (
              <>
                <Separator />
                <PreviewSheetSection>
                  <h4 className="hig-subheadline font-semibold mb-1">Terms</h4>
                  <p className="hig-footnote text-muted-foreground whitespace-pre-wrap">{previewInvoice.terms}</p>
                </PreviewSheetSection>
              </>
            )}

            {/* Tags */}
            {previewInvoice.tags?.filter(t => !["Draft", "Sent", "Viewed", "Paid", "Overdue", "Cancelled"].includes(t.name)).length > 0 && (
              <>
                <Separator />
                <PreviewSheetSection className="flex flex-wrap gap-2">
                  {previewInvoice.tags.filter(t => !["Draft", "Sent", "Viewed", "Paid", "Overdue", "Cancelled"].includes(t.name)).map((tag) => (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full hig-caption-2 font-medium border ${getTagColorClass(tag.color)}`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </PreviewSheetSection>
              </>
            )}
          </PreviewSheetContent>
        </PreviewSheet>
      )}
    </>
  );
}
