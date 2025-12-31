"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, CheckCircle, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useRecordOfflinePayment } from "@/lib/hooks/use-invoices";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export function OfflinePaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isDeposit, setIsDeposit] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, succeeded

  const recordPayment = useRecordOfflinePayment();

  // Calculate balance due
  const balanceDue = invoice?.balanceDue ?? invoice?.total ?? 0;
  const hasDeposit = invoice?.depositPercent > 0 && !invoice?.depositPaidAt;
  const depositAmount = hasDeposit ? Math.round(invoice.total * (invoice.depositPercent / 100)) : 0;

  useEffect(() => {
    if (open) {
      setAmount(balanceDue);
      setMethod("cash");
      setNotes("");
      setIsDeposit(false);
      setStatus("idle");
    }
  }, [open, balanceDue]);

  const handleSubmit = async () => {
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > balanceDue) {
      toast.error(`Amount cannot exceed balance due (${formatCurrency(balanceDue)})`);
      return;
    }

    recordPayment.mutate(
      {
        invoiceId: invoice.id,
        amount,
        method,
        notes: notes.trim() || undefined,
        isDeposit,
      },
      {
        onSuccess: (data) => {
          setStatus("succeeded");
          toast.success(`Payment of ${formatCurrency(amount)} recorded`);
          onSuccess?.(data);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to record payment");
        },
      }
    );
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Record Offline Payment
          </DialogTitle>
          <DialogDescription>
            {status === "idle"
              ? `Record a cash, check, or other offline payment for Invoice ${invoice?.invoiceNumber}`
              : "Payment recorded successfully!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === "succeeded" ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {PAYMENT_METHODS.find((m) => m.value === method)?.label} payment recorded
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Invoice Summary */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span>{formatCurrency(invoice?.total || 0)}</span>
                </div>
                {invoice?.amountPaid > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid</span>
                    <span>-{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Balance Due</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={(amount / 100).toFixed(2)}
                    onChange={(e) => setAmount(Math.round(parseFloat(e.target.value || 0) * 100))}
                    className="pl-8"
                  />
                </div>
                {/* Quick amount buttons */}
                <div className="flex gap-2">
                  {hasDeposit && depositAmount !== balanceDue && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAmount(depositAmount);
                        setIsDeposit(true);
                      }}
                    >
                      Deposit ({formatCurrency(depositAmount)})
                    </Button>
                  )}
                  {amount !== balanceDue && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAmount(balanceDue);
                        setIsDeposit(false);
                      }}
                    >
                      Full Balance ({formatCurrency(balanceDue)})
                    </Button>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Check number, reference, or other details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Is Deposit Toggle */}
              {hasDeposit && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="isDeposit" className="cursor-pointer">
                    Mark as deposit payment
                  </Label>
                  <Switch
                    id="isDeposit"
                    checked={isDeposit}
                    onCheckedChange={setIsDeposit}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {status === "succeeded" ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={recordPayment.isPending || !amount || amount <= 0}
              >
                {recordPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Record {formatCurrency(amount)}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
