"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Percent, DollarSign, CreditCard, Send, FileText, Pencil, Trash2, ExternalLink, Download, User, Calendar, Clock, FileCheck } from "lucide-react";
import {
  MoneyIcon,
  AddIcon,
  MoreIcon,
  DeleteIcon,
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

export function InvoicesList() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [invoiceForPayment, setInvoiceForPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, isDeposit: false, depositPercent: null });
  const [sendingId, setSendingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) setInvoices(await res.json());
    } catch (error) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (invoice, newStatus) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedInvoice = await res.json();
        setInvoices(invoices.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)));
        toast.success(`Invoice marked as ${newStatus}`);
      } else {
        toast.error("Failed to update invoice status");
      }
    } catch (error) {
      toast.error("Failed to update invoice status");
    }
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

  const handleRecordPayment = async () => {
    if (!invoiceForPayment) return;
    setSaving(true);

    try {
      const amountInCents = Math.round(paymentData.amount * 100);
      const currentAmountPaid = invoiceForPayment.amountPaid || 0;
      const newAmountPaid = currentAmountPaid + amountInCents;
      const totalAmount = invoiceForPayment.total;
      const newBalanceDue = totalAmount - newAmountPaid;
      const isPaidInFull = newBalanceDue <= 0;

      const updateData = {
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        ...(paymentData.isDeposit && { depositPaidAt: new Date().toISOString() }),
        ...(isPaidInFull && { status: "paid", paidAt: new Date().toISOString() }),
      };

      const res = await fetch(`/api/invoices/${invoiceForPayment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        const updatedInvoice = await res.json();
        setInvoices(invoices.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)));
        toast.success(paymentData.isDeposit ? "Deposit recorded" : isPaidInFull ? "Invoice marked as paid" : "Payment recorded");
        setPaymentDialogOpen(false);
        setInvoiceForPayment(null);
      } else {
        toast.error("Failed to record payment");
      }
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setInvoices(invoices.filter((i) => i.id !== invoiceToDelete.id));
        toast.success("Invoice deleted");
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch (error) {
      toast.error("Failed to delete invoice");
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleDownload = async (invoice) => {
    try {
      setDownloadingId(invoice.id);
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSend = async (invoice) => {
    try {
      setSendingId(invoice.id);
      const res = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send invoice");
      }

      const data = await res.json();
      toast.success("Invoice sent successfully");
      setInvoices(invoices.map((i) =>
        i.id === invoice.id ? { ...i, status: "sent" } : i
      ));

      if (data.warning) {
        toast.warning(data.warning);
      }
    } catch (error) {
      toast.error(error.message || "Failed to send invoice");
    } finally {
      setSendingId(null);
    }
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Total Collected</p>
          <div className="text-xl md:text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Outstanding</p>
          <div className="text-xl md:text-2xl font-bold">{formatPrice(stats.outstandingAmount)}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Paid Invoices</p>
          <div className="text-xl md:text-2xl font-bold">{stats.paid}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Overdue</p>
          <div className="text-xl md:text-2xl font-bold text-destructive">{stats.overdue}</div>
        </div>
      </div>

      <Card className="p-4">
        <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 mb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <MoneyIcon className="h-5 w-5 text-success" />
              Invoices
            </CardTitle>
            <p className="text-sm mt-2 text-muted-foreground">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button size="sm" onClick={() => router.push("/dashboard/invoices/new")}>
            <AddIcon className="h-4 w-4 mr-1" />
            Create Invoice
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <InvoiceIcon className="h-6 w-6 text-success" />
              </div>
              <h3 className="text-base font-medium mb-3">No invoices yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first invoice to track payments
              </p>
              <Button size="sm" onClick={() => router.push("/dashboard/invoices/new")}>
                <AddIcon className="h-4 w-4 mr-1" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="hidden sm:table-cell">Client</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setPreviewInvoice(invoice);
                        setPreviewSheetOpen(true);
                      }}
                    >
                      <TableCell>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewInvoice(invoice);
                            setPreviewSheetOpen(true);
                          }}
                          className="text-sm font-medium text-primary hover:underline cursor-pointer"
                        >
                          {invoice.invoiceNumber}
                        </button>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div>
                          <p className="text-sm font-medium">{invoice.contactName}</p>
                          <p className="text-xs text-muted-foreground">{invoice.contactEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <PendingIcon className="h-3.5 w-3.5" />
                          {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{formatPrice(invoice.total)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[invoice.status]?.variant || "secondary"}>
                          {statusConfig[invoice.status]?.label || invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDownload(invoice)}
                              disabled={downloadingId === invoice.id}
                            >
                              {downloadingId === invoice.id ? (
                                <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <DownloadIcon className="h-4 w-4 mr-2" />
                              )}
                              {downloadingId === invoice.id ? "Downloading..." : "Download PDF"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {invoice.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => handleSend(invoice)}
                                disabled={sendingId === invoice.id}
                              >
                                {sendingId === invoice.id ? (
                                  <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <SendIcon className="h-4 w-4 mr-2" />
                                )}
                                {sendingId === invoice.id ? "Sending..." : "Send Invoice"}
                              </DropdownMenuItem>
                            )}
                            {["sent", "viewed", "overdue"].includes(invoice.status) && (
                              <>
                                <DropdownMenuItem onClick={() => handleOpenPaymentDialog(invoice)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(invoice, "paid")}>
                                  <CompleteIcon className="h-4 w-4 mr-2" />
                                  Mark as Paid (Full)
                                </DropdownMenuItem>
                              </>
                            )}
                            {invoice.status !== "cancelled" && invoice.status !== "paid" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(invoice, "cancelled")}>
                                <CloseIcon className="h-4 w-4 mr-2" />
                                Cancel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setInvoiceToDelete(invoice);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <DeleteIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-medium">{formatPrice(invoiceForPayment.total)}</span>
                </div>
                {(invoiceForPayment.amountPaid || 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid</span>
                    <span>{formatPrice(invoiceForPayment.amountPaid || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                  <span>Balance Due</span>
                  <span>{formatPrice(invoiceForPayment.balanceDue || invoiceForPayment.total - (invoiceForPayment.amountPaid || 0))}</span>
                </div>
              </div>

              {getSafeDepositPercent(invoiceForPayment.depositPercent) > 0 && !invoiceForPayment.depositPaidAt && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Type</Label>
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
                  <p className="text-xs text-muted-foreground">
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
            <Button onClick={handleRecordPayment} disabled={saving || paymentData.amount <= 0}>
              {saving && <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Sheet */}
      <Sheet open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0 pb-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>{previewInvoice?.invoiceNumber || "Invoice Preview"}</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center pt-2 pb-3 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {previewInvoice && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="px-4 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{previewInvoice.invoiceNumber}</h3>
                  <Badge variant={statusConfig[previewInvoice.status]?.variant || "secondary"}>
                    {statusConfig[previewInvoice.status]?.label || previewInvoice.status}
                  </Badge>
                </div>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="px-4 space-y-4 pb-4">
                  {/* Contact Info */}
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{previewInvoice.contactName}</p>
                      <p className="text-sm text-muted-foreground truncate">{previewInvoice.contactEmail}</p>
                      {previewInvoice.contactAddress && (
                        <p className="text-xs text-muted-foreground truncate">{previewInvoice.contactAddress}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Issue Date</p>
                        <p className="text-sm font-medium">{format(new Date(previewInvoice.issueDate || previewInvoice.createdAt), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="text-sm font-medium">{format(new Date(previewInvoice.dueDate), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    {previewInvoice.sentAt && (
                      <div className="flex items-center gap-2">
                        <Send className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sent</p>
                          <p className="text-sm font-medium">{format(new Date(previewInvoice.sentAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    )}
                    {previewInvoice.paidAt && (
                      <div className="flex items-center gap-2">
                        <FileCheck className="size-4 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="text-sm font-medium text-green-600">{format(new Date(previewInvoice.paidAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Line Items */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Line Items</h4>
                    <div className="space-y-2">
                      {(previewInvoice.lineItems || []).map((item, index) => (
                        <div key={index} className={`flex justify-between items-start text-sm ${item.isDiscount ? "text-red-600" : ""}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.description || "Item"}</p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-muted-foreground">
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
                  </div>

                  <Separator />

                  {/* Financial Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(previewInvoice.subtotal)}</span>
                    </div>
                    {(previewInvoice.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount {previewInvoice.discountCode ? `(${previewInvoice.discountCode})` : ""}</span>
                        <span>-{formatPrice(previewInvoice.discountAmount)}</span>
                      </div>
                    )}
                    {(previewInvoice.taxAmount || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax ({previewInvoice.taxRate}%)</span>
                        <span>{formatPrice(previewInvoice.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(previewInvoice.total)}</span>
                    </div>

                    {/* Deposit Info */}
                    {getSafeDepositPercent(previewInvoice.depositPercent) > 0 && (
                      <div className={`flex justify-between text-sm ${previewInvoice.depositPaidAt ? "text-green-600" : "text-blue-600"}`}>
                        <span>Deposit ({getSafeDepositPercent(previewInvoice.depositPercent)}%)</span>
                        <span>
                          {previewInvoice.depositPaidAt ? "✓ " : ""}
                          {formatPrice(getSafeDepositAmount(previewInvoice))}
                        </span>
                      </div>
                    )}

                    {/* Payment Info */}
                    {(previewInvoice.amountPaid || 0) > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Amount Paid</span>
                        <span>{formatPrice(previewInvoice.amountPaid)}</span>
                      </div>
                    )}
                    {(previewInvoice.balanceDue || 0) > 0 && previewInvoice.status !== "paid" && (
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Balance Due</span>
                        <span>{formatPrice(previewInvoice.balanceDue)}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {previewInvoice.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-1">Notes</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{previewInvoice.notes}</p>
                      </div>
                    </>
                  )}

                  {/* Terms */}
                  {previewInvoice.terms && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-1">Terms</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{previewInvoice.terms}</p>
                      </div>
                    </>
                  )}

                  {/* Tags */}
                  {previewInvoice.tags?.filter(t => !["Draft", "Sent", "Viewed", "Paid", "Overdue", "Cancelled"].includes(t.name)).length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        {previewInvoice.tags.filter(t => !["Draft", "Sent", "Viewed", "Paid", "Overdue", "Cancelled"].includes(t.name)).map((tag) => (
                          <span
                            key={tag.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTagColorClass(tag.color)}`}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* 5 Quick Actions */}
              <div className="border-t bg-muted/30 px-4 py-3 grid grid-cols-5 gap-2">
                {/* Action 1: Send (if draft) or Pay (if sent/viewed/overdue) */}
                {previewInvoice.status === "draft" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1"
                    disabled={sendingId === previewInvoice.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSheetOpen(false);
                      handleSend(previewInvoice);
                    }}
                  >
                    <Send className="h-5 w-5" />
                    <span className="text-xs">Send</span>
                  </Button>
                ) : ["sent", "viewed", "overdue"].includes(previewInvoice.status) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSheetOpen(false);
                      handleOpenPaymentDialog(previewInvoice);
                    }}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Pay</span>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-1 opacity-50" disabled>
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Pay</span>
                  </Button>
                )}

                {/* Action 2: Download PDF */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1"
                  disabled={downloadingId === previewInvoice.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(previewInvoice);
                  }}
                >
                  <Download className="h-5 w-5" />
                  <span className="text-xs">PDF</span>
                </Button>

                {/* Action 3: Edit */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSheetOpen(false);
                    router.push(`/dashboard/invoices/${previewInvoice.id}`);
                  }}
                >
                  <Pencil className="h-5 w-5" />
                  <span className="text-xs">Edit</span>
                </Button>

                {/* Action 4: Mark Paid (if applicable) */}
                {["sent", "viewed", "overdue"].includes(previewInvoice.status) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-col h-auto py-2 gap-1 text-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSheetOpen(false);
                      handleStatusChange(previewInvoice, "paid");
                    }}
                  >
                    <CompleteIcon className="h-5 w-5" />
                    <span className="text-xs">Paid</span>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="flex-col h-auto py-2 gap-1 opacity-50" disabled>
                    <CompleteIcon className="h-5 w-5" />
                    <span className="text-xs">Paid</span>
                  </Button>
                )}

                {/* Action 5: Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-col h-auto py-2 gap-1 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewSheetOpen(false);
                    setInvoiceToDelete(previewInvoice);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>

              <div className="h-[env(safe-area-inset-bottom)]" />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
