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
} from "@/lib/hooks";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Percent, DollarSign, CreditCard, Send, Pencil, Trash2, Download, User, Calendar, Clock, FileCheck, Ticket } from "lucide-react";
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

  const handleStatusChange = (invoice, newStatus) => {
    updateInvoice.mutate(
      { id: invoice.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Invoice marked as ${newStatus}`);
        },
        onError: () => {
          toast.error("Failed to update invoice status");
        },
      }
    );
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

  // Define columns for DataTable
  const columns = [
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
            <DataTable
              columns={columns}
              data={invoices}
              searchPlaceholder="Search invoices..."
              pageSize={25}
              onRowClick={(invoice) => {
                setPreviewInvoice(invoice);
                setPreviewSheetOpen(true);
              }}
              emptyMessage="No invoices found."
            />
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

              {/* Action 3: Mark Paid (if applicable) */}
              {["sent", "viewed", "overdue"].includes(previewInvoice.status) ? (
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

              {/* Action 4: Edit */}
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

              {/* Action 5: Delete */}
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
