"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  Clock,
  User,
  Receipt,
  ExternalLink,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { usePayment, useRefundPayment } from "@/lib/hooks";

function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatShortDate(date) {
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
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
          <CheckCircle2 className="size-3" />
          Succeeded
        </Badge>
      );
    case "refunded":
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Refunded</Badge>;
    case "partial_refund":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Partial Refund</Badge>;
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

export default function PaymentDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  const { data, isLoading: loading } = usePayment(id);
  const refundMutation = useRefundPayment();

  const payment = data?.payment;

  useEffect(() => {
    if (payment) {
      const refundable = payment.amount - (payment.refundedAmount || 0);
      setRefundAmount((refundable / 100).toFixed(2));
    }
  }, [payment]);

  const handleRefund = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }

    const amountInCents = Math.round(parseFloat(refundAmount) * 100);
    const maxRefundable = payment.amount - (payment.refundedAmount || 0);

    if (amountInCents > maxRefundable) {
      toast.error(`Maximum refundable amount is ${formatPrice(maxRefundable)}`);
      return;
    }

    refundMutation.mutate(
      { id, amount: amountInCents },
      {
        onSuccess: () => {
          toast.success("Refund processed successfully");
          setRefundOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to process refund");
        },
      }
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="hig-footnote text-muted-foreground mt-2">Loading payment details...</p>
      </div>
    );
  }

  if (!payment) {
    return null;
  }

  const isDeposit = payment.depositAmount && payment.depositAmount > 0;
  const refundable = payment.amount - (payment.refundedAmount || 0);
  const canRefund = payment.status === "succeeded" && refundable > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="size-11 shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="size-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="hig-title-2 truncate">Payment Details</h1>
              <StatusBadge status={payment.status} disputeStatus={payment.disputeStatus} />
            </div>
            <p className="hig-footnote text-muted-foreground truncate">{payment.stripePaymentIntentId}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {payment.stripeReceiptUrl && (
            <a href={payment.stripeReceiptUrl} target="_blank" rel="noopener noreferrer" className="flex-1 fold:flex-none">
              <Button size="sm" variant="outline" className="w-full">
                <Receipt className="size-4 mr-1" />
                Receipt
              </Button>
            </a>
          )}
          {canRefund && (
            <Button size="sm" variant="outline" className="flex-1 fold:flex-none text-destructive hover:text-destructive" onClick={() => setRefundOpen(true)}>
              <RefreshCw className="size-4 mr-1" />
              Refund
            </Button>
          )}
          {payment.stripeChargeId && (
            <a href={`https://dashboard.stripe.com/connect/charges/${payment.stripeChargeId}`} target="_blank" rel="noopener noreferrer" className="flex-1 fold:flex-none">
              <Button size="sm" variant="ghost" className="w-full">
                <ExternalLink className="size-4 mr-1" />
                Stripe
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Payment Amount Card */}
      <div className="rounded-xl bg-green-600 dark:bg-green-700 p-5">
        <p className="hig-footnote text-green-100 mb-1">Amount Paid</p>
        <p className="text-3xl font-bold text-white">{formatPrice(payment.amount)}</p>
        {payment.refundedAmount > 0 && (
          <p className="hig-footnote text-green-100 mt-2">
            Refunded: {formatPrice(payment.refundedAmount)} · Net: {formatPrice(payment.amount - payment.refundedAmount)}
          </p>
        )}
      </div>

      {/* Deposit Details */}
      {isDeposit && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="hig-headline">Deposit Payment</h3>
          <div className="space-y-2">
            <div className="flex justify-between hig-body">
              <span className="text-muted-foreground">Service Total</span>
              <span>{formatPrice(payment.serviceTotal)}</span>
            </div>
            <div className="flex justify-between hig-body">
              <span className="text-muted-foreground">Deposit Paid</span>
              <span className="text-green-600">{formatPrice(payment.depositAmount)}</span>
            </div>
            <div className="flex justify-between hig-body pt-2 border-t">
              <span className="font-medium">Remaining Balance</span>
              <span className="font-medium text-orange-600">
                {formatPrice(payment.serviceTotal - payment.depositAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout for tablet+ */}
      <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4">
        {/* Customer Info */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <User className="size-5 text-muted-foreground" />
            <h3 className="hig-headline">Customer</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="font-medium text-primary">
                {payment.clientName?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="hig-body font-medium truncate">{payment.clientName || "Unknown"}</p>
              <p className="hig-footnote text-muted-foreground truncate">{payment.clientEmail}</p>
            </div>
          </div>
          {payment.contact && (
            <Link href={`/dashboard/contacts/${payment.contact.id}`}>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Contact
                <ExternalLink className="size-3 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {/* Payment Method */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-muted-foreground" />
            <h3 className="hig-headline">Payment Method</h3>
          </div>
          {payment.cardBrand && payment.cardLast4 ? (
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <CreditCard className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="hig-body font-medium capitalize">{payment.cardBrand}</p>
                <p className="hig-footnote text-muted-foreground">•••• {payment.cardLast4}</p>
              </div>
            </div>
          ) : (
            <p className="hig-body text-muted-foreground">Card details not available</p>
          )}
        </div>
      </div>

      {/* Booking Details */}
      {payment.booking && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-muted-foreground" />
            <h3 className="hig-headline">Booking</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="hig-footnote text-muted-foreground">Scheduled</p>
              <p className="hig-body">{formatDate(payment.booking.scheduledAt)}</p>
            </div>

            <div className="flex gap-4 flex-wrap">
              <div>
                <p className="hig-footnote text-muted-foreground">Duration</p>
                <p className="hig-body">
                  {payment.booking.duration >= 60
                    ? `${Math.floor(payment.booking.duration / 60)}h ${payment.booking.duration % 60 > 0 ? `${payment.booking.duration % 60}m` : ""}`
                    : `${payment.booking.duration} min`}
                </p>
              </div>
              <div>
                <p className="hig-footnote text-muted-foreground">Status</p>
                <Badge variant="outline" className="capitalize mt-0.5">
                  {payment.booking.status}
                </Badge>
              </div>
              <div>
                <p className="hig-footnote text-muted-foreground">Payment</p>
                <Badge variant="outline" className="capitalize mt-0.5">
                  {payment.booking.paymentStatus?.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {payment.serviceDetails?.length > 0 && (
              <div className="pt-3 border-t space-y-2">
                <p className="hig-footnote text-muted-foreground">Services</p>
                {payment.serviceDetails.map((service, idx) => (
                  <div key={idx} className="flex justify-between hig-body">
                    <span className="flex items-center gap-2">
                      {service.name}
                      {service.isPackage && <Badge variant="outline" className="hig-caption2">Package</Badge>}
                    </span>
                    <span className="font-medium">{formatPrice(service.price)}</span>
                  </div>
                ))}
              </div>
            )}

            {payment.booking.notes && (
              <div className="pt-3 border-t">
                <p className="hig-footnote text-muted-foreground mb-1">Notes</p>
                <p className="hig-body">{payment.booking.notes}</p>
              </div>
            )}
          </div>

          <Link href={`/dashboard/bookings/${payment.booking.id}`}>
            <Button variant="outline" className="w-full">
              View Booking
              <ExternalLink className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* Timestamps */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="size-5 text-muted-foreground" />
          <h3 className="hig-headline">Timestamps</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between hig-body">
            <span className="text-muted-foreground">Created</span>
            <span>{formatShortDate(payment.createdAt)}</span>
          </div>
          {payment.capturedAt && (
            <div className="flex justify-between hig-body">
              <span className="text-muted-foreground">Captured</span>
              <span>{formatShortDate(payment.capturedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dispute Info */}
      {payment.disputeStatus && (
        <div className="rounded-xl border-2 border-destructive bg-destructive/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <h3 className="hig-headline">Dispute Information</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between hig-body">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="destructive">{payment.disputeStatus}</Badge>
            </div>
            {payment.metadata?.dispute && (
              <>
                <div className="flex justify-between hig-body">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="capitalize">{payment.metadata.dispute.reason}</span>
                </div>
                <div className="flex justify-between hig-body">
                  <span className="text-muted-foreground">Amount</span>
                  <span>{formatPrice(payment.metadata.dispute.amount)}</span>
                </div>
              </>
            )}
          </div>
          <p className="hig-footnote text-muted-foreground">
            Check your Stripe Dashboard for dispute details and to submit evidence.
          </p>
        </div>
      )}

      {/* Refund Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>
              Enter the amount to refund. Maximum refundable: {formatPrice(refundable)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refundAmount">Refund Amount ($)</Label>
              <Input
                id="refundAmount"
                type="number"
                min="0.01"
                max={(refundable / 100).toFixed(2)}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setRefundAmount((refundable / 100).toFixed(2))}>
                Full Refund
              </Button>
              <Button variant="outline" size="sm" onClick={() => setRefundAmount((refundable / 200).toFixed(2))}>
                50% Refund
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRefund} disabled={refundMutation.isPending}>
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4 mr-2" />
                  Refund {refundAmount ? formatPrice(parseFloat(refundAmount) * 100) : "$0.00"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
