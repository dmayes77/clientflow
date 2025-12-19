"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Loader2,
  CreditCard,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  Smartphone,
  DollarSign,
} from "lucide-react";

function formatDeviceType(type) {
  const deviceNames = {
    stripe_s700: "Stripe Reader S700",
    bbpos_wisepos_e: "BBPOS WisePOS E",
    verifone_P400: "Verifone P400",
    bbpos_chipper2x: "BBPOS Chipper 2X BT",
    stripe_m2: "Stripe Reader M2",
  };
  return deviceNames[type] || type || "Card Reader";
}

function formatCurrency(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function CollectPaymentModal({
  open,
  onOpenChange,
  amount: initialAmount,
  bookingId,
  invoiceId,
  contactId,
  description,
  onSuccess,
}) {
  const [readers, setReaders] = useState([]);
  const [selectedReaderId, setSelectedReaderId] = useState("");
  const [amount, setAmount] = useState(initialAmount || 0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, processing, waiting, succeeded, failed
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchReaders();
      setAmount(initialAmount || 0);
      setStatus("idle");
      setError(null);
      setPaymentResult(null);
    }
  }, [open, initialAmount]);

  const fetchReaders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/terminal/readers");
      if (res.ok) {
        const data = await res.json();
        setReaders(data.readers || []);
        // Auto-select first online reader
        const onlineReader = data.readers?.find((r) => r.status === "online");
        if (onlineReader) {
          setSelectedReaderId(onlineReader.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch readers:", error);
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = useCallback(async (piId) => {
    try {
      const res = await fetch(`/api/stripe/terminal/payment-intent?id=${piId}`);
      if (res.ok) {
        const data = await res.json();
        const piStatus = data.paymentIntent?.status;

        if (piStatus === "succeeded") {
          setStatus("succeeded");
          setPaymentResult({
            amount: data.paymentIntent.amount,
            charge: data.charge,
          });
          toast.success("Payment collected successfully!");
          onSuccess?.(data);
          return true; // Stop polling
        } else if (piStatus === "canceled" || piStatus === "requires_payment_method") {
          setStatus("failed");
          setError(data.paymentIntent?.cancellationReason || "Payment was canceled");
          return true; // Stop polling
        }
      }
      return false; // Continue polling
    } catch (error) {
      console.error("Error polling payment status:", error);
      return false;
    }
  }, [onSuccess]);

  useEffect(() => {
    let pollInterval;

    if (status === "waiting" && paymentIntentId) {
      pollInterval = setInterval(async () => {
        const shouldStop = await pollPaymentStatus(paymentIntentId);
        if (shouldStop) {
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [status, paymentIntentId, pollPaymentStatus]);

  const handleCollectPayment = async () => {
    if (!selectedReaderId) {
      toast.error("Please select a reader");
      return;
    }

    if (!amount || amount < 50) {
      toast.error("Amount must be at least $0.50");
      return;
    }

    setProcessing(true);
    setStatus("processing");
    setError(null);

    try {
      // Step 1: Create PaymentIntent
      const piRes = await fetch("/api/stripe/terminal/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bookingId,
          invoiceId,
          contactId,
          description,
        }),
      });

      if (!piRes.ok) {
        const error = await piRes.json();
        throw new Error(error.error || "Failed to create payment");
      }

      const piData = await piRes.json();
      setPaymentIntentId(piData.paymentIntent.id);

      // Step 2: Send to reader
      const processRes = await fetch("/api/stripe/terminal/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readerId: selectedReaderId,
          paymentIntentId: piData.paymentIntent.id,
        }),
      });

      if (!processRes.ok) {
        const error = await processRes.json();
        throw new Error(error.error || "Failed to send payment to reader");
      }

      // Step 3: Start polling for payment completion
      setStatus("waiting");
      toast.info("Waiting for customer to tap or insert card...");
    } catch (error) {
      console.error("Payment collection error:", error);
      setStatus("failed");
      setError(error.message);
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (status === "waiting" && selectedReaderId) {
      try {
        await fetch(`/api/stripe/terminal/process-payment?readerId=${selectedReaderId}`, {
          method: "DELETE",
        });
        toast.info("Payment canceled");
      } catch (error) {
        console.error("Failed to cancel:", error);
      }
    }
    setStatus("idle");
    setPaymentIntentId(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (status === "waiting") {
      handleCancel();
    } else {
      onOpenChange(false);
    }
  };

  const onlineReaders = readers.filter((r) => r.status === "online");
  const hasOnlineReaders = onlineReaders.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Collect In-Person Payment
          </DialogTitle>
          <DialogDescription>
            {status === "idle" && "Send payment to a card reader for collection"}
            {status === "processing" && "Setting up payment..."}
            {status === "waiting" && "Waiting for customer to tap or insert card..."}
            {status === "succeeded" && "Payment collected successfully!"}
            {status === "failed" && "Payment failed"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : status === "succeeded" ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <p className="text-lg font-semibold">
                  {formatCurrency(paymentResult?.amount || amount)}
                </p>
                <p className="text-sm text-muted-foreground">Payment successful</p>
              </div>
              {paymentResult?.charge?.cardBrand && (
                <p className="text-sm text-muted-foreground">
                  {paymentResult.charge.cardBrand.toUpperCase()} ****{paymentResult.charge.cardLast4}
                </p>
              )}
            </div>
          ) : status === "failed" ? (
            <div className="text-center py-6 space-y-3">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <div>
                <p className="text-lg font-semibold">Payment Failed</p>
                <p className="text-sm text-muted-foreground">{error || "Please try again"}</p>
              </div>
            </div>
          ) : status === "waiting" ? (
            <div className="text-center py-6 space-y-4">
              <div className="relative">
                <Smartphone className="h-16 w-16 mx-auto text-primary animate-pulse" />
                <div className="absolute -top-1 -right-1 left-0 flex justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold">{formatCurrency(amount)}</p>
                <p className="text-sm text-muted-foreground">
                  Tap, insert, or swipe card on the reader
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Reader Selection */}
              <div className="space-y-2">
                <Label htmlFor="reader">Card Reader</Label>
                {readers.length === 0 ? (
                  <div className="p-4 border rounded-lg text-center">
                    <Smartphone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No readers set up. Go to Account settings to add a reader.
                    </p>
                  </div>
                ) : !hasOnlineReaders ? (
                  <div className="p-4 border rounded-lg text-center">
                    <WifiOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No readers online. Please ensure your reader is powered on and connected.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={fetchReaders}>
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <Select value={selectedReaderId} onValueChange={setSelectedReaderId}>
                    <SelectTrigger id="reader">
                      <SelectValue placeholder="Select a reader" />
                    </SelectTrigger>
                    <SelectContent>
                      {readers.map((reader) => (
                        <SelectItem
                          key={reader.id}
                          value={reader.id}
                          disabled={reader.status !== "online"}
                        >
                          <div className="flex items-center gap-2">
                            {reader.status === "online" ? (
                              <Wifi className="h-3 w-3 text-green-500" />
                            ) : (
                              <WifiOff className="h-3 w-3 text-gray-400" />
                            )}
                            <span>{reader.label}</span>
                            <span className="text-muted-foreground text-xs">
                              ({formatDeviceType(reader.deviceType)})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
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
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {status === "succeeded" ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : status === "failed" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setStatus("idle")}>Try Again</Button>
            </>
          ) : status === "waiting" ? (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCollectPayment}
                disabled={!hasOnlineReaders || !selectedReaderId || processing || amount < 50}
              >
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Collect {formatCurrency(amount)}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
