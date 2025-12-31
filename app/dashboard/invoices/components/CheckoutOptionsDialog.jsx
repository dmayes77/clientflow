"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Link2,
  CheckCircle,
  Copy,
  ExternalLink,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useCreateInvoiceCheckout } from "@/lib/hooks/use-invoices";

export function CheckoutOptionsDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}) {
  const [status, setStatus] = useState("idle"); // idle, loading, success
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const createCheckout = useCreateInvoiceCheckout();

  // Calculate amounts
  const total = invoice?.total || 0;
  const amountPaid = invoice?.amountPaid || 0;
  const balanceDue = invoice?.balanceDue ?? (total - amountPaid);
  const hasDeposit = invoice?.depositPercent > 0;
  const depositPaid = !!invoice?.depositPaidAt;
  const depositAmount = hasDeposit ? Math.round(total * (invoice.depositPercent / 100)) : 0;

  // Determine available payment options
  const getPaymentOptions = () => {
    const options = [];

    if (balanceDue <= 0) {
      return []; // Already paid
    }

    // If deposit not yet paid and deposit is configured
    if (hasDeposit && !depositPaid) {
      options.push({
        id: "deposit",
        label: "Pay Deposit",
        description: `${invoice.depositPercent}% deposit`,
        amount: depositAmount,
        paymentOption: "deposit",
      });
    }

    // If deposit paid, show balance option
    if (depositPaid && balanceDue > 0) {
      options.push({
        id: "balance",
        label: "Pay Remaining Balance",
        description: "Complete payment",
        amount: balanceDue,
        paymentOption: "balance",
      });
    }

    // Always show full payment option (if not already paid)
    if (balanceDue > 0) {
      const fullAmount = depositPaid ? balanceDue : total - amountPaid;
      options.push({
        id: "full",
        label: depositPaid ? "Pay Full Balance" : "Pay Full Amount",
        description: depositPaid ? "Remaining balance" : "Complete invoice total",
        amount: fullAmount,
        paymentOption: "full",
      });
    }

    // Remove duplicates (if deposit equals full amount)
    const uniqueOptions = options.filter((opt, index, self) =>
      index === self.findIndex((t) => t.amount === opt.amount)
    );

    return uniqueOptions;
  };

  const paymentOptions = getPaymentOptions();

  const handleGenerateLink = async (option) => {
    setSelectedOption(option.id);
    setStatus("loading");

    createCheckout.mutate(
      {
        invoiceId: invoice.id,
        paymentOption: option.paymentOption,
      },
      {
        onSuccess: (data) => {
          setCheckoutUrl(data.checkoutUrl);
          setStatus("success");
          onSuccess?.(data);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to generate checkout link");
          setStatus("idle");
          setSelectedOption(null);
        },
      }
    );
  };

  const handleCopyLink = async () => {
    if (!checkoutUrl) return;

    try {
      await navigator.clipboard.writeText(checkoutUrl);
      toast.success("Payment link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleOpenLink = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setCheckoutUrl(null);
    setSelectedOption(null);
    onOpenChange(false);
  };

  const handleReset = () => {
    setStatus("idle");
    setCheckoutUrl(null);
    setSelectedOption(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Generate Payment Link
          </DialogTitle>
          <DialogDescription>
            {status === "success"
              ? "Share this link with your customer to collect payment"
              : `Create a secure payment link for Invoice ${invoice?.invoiceNumber}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === "success" && checkoutUrl ? (
            <div className="space-y-4">
              <div className="text-center py-4 space-y-3">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <p className="text-sm text-muted-foreground">
                  Payment link ready for{" "}
                  {formatCurrency(paymentOptions.find((o) => o.id === selectedOption)?.amount || balanceDue)}
                </p>
              </div>

              {/* Link display and actions */}
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm break-all font-mono text-muted-foreground">
                    {checkoutUrl.length > 60 ? checkoutUrl.substring(0, 60) + "..." : checkoutUrl}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopyLink}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleOpenLink}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>
            </div>
          ) : paymentOptions.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <p className="text-lg font-semibold">Invoice Paid</p>
                <p className="text-sm text-muted-foreground">
                  This invoice has already been paid in full
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Invoice Summary */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {amountPaid > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Amount Paid</span>
                    <span>-{formatCurrency(amountPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-1 border-t">
                  <span>Balance Due</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Select Payment Amount</p>
                {paymentOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleGenerateLink(option)}
                    disabled={status === "loading"}
                    className="w-full p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      {option.id === "deposit" ? (
                        <DollarSign className="h-5 w-5 text-blue-500" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {status === "loading" && selectedOption === option.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="font-semibold">{formatCurrency(option.amount)}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {status === "success" ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Generate Another
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
