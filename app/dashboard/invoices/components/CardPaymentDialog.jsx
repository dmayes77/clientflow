"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, DollarSign, CheckCircle, CreditCard, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useChargeCard } from "@/lib/hooks/use-invoices";

// Cache for Stripe instances per connected account
const stripeInstanceCache = new Map();

// Get or create a Stripe instance for a connected account
function getStripePromise(stripeAccountId) {
  if (!stripeAccountId) return null;

  if (!stripeInstanceCache.has(stripeAccountId)) {
    // Load Stripe with the connected account - this ensures PaymentMethods
    // are created on the connected account, not the platform
    const promise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
      stripeAccount: stripeAccountId,
    });
    stripeInstanceCache.set(stripeAccountId, promise);
  }

  return stripeInstanceCache.get(stripeAccountId);
}

// Card Element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1a1a1a",
      fontFamily: "system-ui, -apple-system, sans-serif",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
};

// Inner form component that uses Stripe hooks
function CardPaymentForm({
  invoice,
  stripeAccountId,
  onSuccess,
  onClose,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState(0);
  const [isDeposit, setIsDeposit] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, processing, succeeded, failed
  const [cardError, setCardError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  const chargeCard = useChargeCard();

  // Calculate balance due
  const balanceDue = invoice?.balanceDue ?? invoice?.total ?? 0;
  const hasDeposit = invoice?.depositPercent > 0 && !invoice?.depositPaidAt;
  const depositAmount = hasDeposit ? Math.round(invoice.total * (invoice.depositPercent / 100)) : 0;

  useEffect(() => {
    setAmount(balanceDue);
    setIsDeposit(false);
    setStatus("idle");
    setCardError(null);
    setPaymentResult(null);
  }, [balanceDue]);

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      toast.error("Stripe not loaded. Please try again.");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > balanceDue) {
      toast.error(`Amount cannot exceed balance due (${formatCurrency(balanceDue)})`);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Card element not found");
      return;
    }

    setStatus("processing");
    setCardError(null);

    try {
      // Step 1: Create PaymentMethod from card details
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError) {
        setCardError(pmError.message);
        setStatus("failed");
        return;
      }

      // Step 2: Send to backend to charge the card
      chargeCard.mutate(
        {
          invoiceId: invoice.id,
          paymentMethodId: paymentMethod.id,
          amount,
          isDeposit,
        },
        {
          onSuccess: async (data) => {
            // Check if 3DS is required
            if (data.requiresAction && data.clientSecret) {
              // Handle 3DS authentication
              // Note: stripe instance is already initialized with connected account,
              // so no need to pass stripeAccount option
              const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                data.clientSecret
              );

              if (confirmError) {
                setCardError(confirmError.message);
                setStatus("failed");
                return;
              }

              if (paymentIntent.status === "succeeded") {
                setStatus("succeeded");
                setPaymentResult({ amount });
                toast.success(`Payment of ${formatCurrency(amount)} processed`);
                onSuccess?.(data);
              } else {
                setCardError("Payment could not be completed");
                setStatus("failed");
              }
            } else if (data.success) {
              // Payment succeeded without 3DS
              setStatus("succeeded");
              setPaymentResult({
                amount,
                cardBrand: data.payment?.cardBrand,
                cardLast4: data.payment?.cardLast4,
              });
              toast.success(`Payment of ${formatCurrency(amount)} processed`);
              onSuccess?.(data);
            } else {
              setCardError("Payment failed");
              setStatus("failed");
            }
          },
          onError: (error) => {
            setCardError(error.message || "Failed to process payment");
            setStatus("failed");
          },
        }
      );
    } catch (error) {
      setCardError(error.message || "An unexpected error occurred");
      setStatus("failed");
    }
  };

  const isProcessing = status === "processing" || chargeCard.isPending;

  return (
    <>
      <div className="space-y-4 py-4">
        {status === "succeeded" ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <p className="text-lg font-semibold">{formatCurrency(paymentResult?.amount || amount)}</p>
              <p className="text-sm text-muted-foreground">
                Card payment processed
              </p>
            </div>
            {paymentResult?.cardBrand && paymentResult?.cardLast4 && (
              <p className="text-sm text-muted-foreground">
                {paymentResult.cardBrand.toUpperCase()} ****{paymentResult.cardLast4}
              </p>
            )}
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
                  min={0.50}
                  step={0.01}
                  value={(amount / 100).toFixed(2)}
                  onChange={(e) => setAmount(Math.round(parseFloat(e.target.value || 0) * 100))}
                  className="pl-8"
                  disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
                  >
                    Full Balance ({formatCurrency(balanceDue)})
                  </Button>
                )}
              </div>
            </div>

            {/* Card Input */}
            <div className="space-y-2">
              <Label>Card Details</Label>
              <div className="p-3 border rounded-md bg-white">
                <CardElement
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={handleCardChange}
                />
              </div>
              {cardError && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {cardError}
                </div>
              )}
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
                  disabled={isProcessing}
                />
              </div>
            )}
          </>
        )}
      </div>

      <DialogFooter>
        {status === "succeeded" ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || !stripe || !elements || !amount || amount <= 0 || amount < 50}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Charge {formatCurrency(amount)}
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}

export function CardPaymentDialog({
  open,
  onOpenChange,
  invoice,
  stripeAccountId,
  onSuccess,
}) {
  // Get or create Stripe instance for this connected account
  // useMemo ensures we don't recreate the promise on every render
  const stripePromise = useMemo(
    () => getStripePromise(stripeAccountId),
    [stripeAccountId]
  );

  const handleClose = () => {
    onOpenChange(false);
  };

  // Don't render Elements until we have the connected account
  if (!stripeAccountId) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Enter Card Details
            </DialogTitle>
            <DialogDescription>
              Stripe payments are not configured. Please complete Stripe Connect setup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Enter Card Details
          </DialogTitle>
          <DialogDescription>
            Manually enter card details for Invoice {invoice?.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <CardPaymentForm
            invoice={invoice}
            stripeAccountId={stripeAccountId}
            onSuccess={onSuccess}
            onClose={handleClose}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
