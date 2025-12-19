"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Shield,
  DollarSign,
  AlertTriangle,
  Plug,
  Save,
  Percent,
  Banknote,
  Settings,
} from "lucide-react";
import { TerminalReaders } from "./components/TerminalReaders";
import { ReaderRecommendations } from "./components/ReaderRecommendations";
import { TapToPayInfo } from "./components/TapToPayInfo";

function AccountPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stripeAccount, setStripeAccount] = useState(null);
  const [settings, setSettings] = useState({
    requirePayment: false,
    paymentType: "full",
    depositType: "percentage",
    depositValue: 50,
    payInFullDiscount: 0,
  });

  useEffect(() => {
    fetchData();

    // Show success message if returning from Stripe onboarding
    if (searchParams.get("success") === "true") {
      toast.success("Stripe account connected successfully!");
      window.history.replaceState({}, "", "/dashboard/account");
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [accountRes, settingsRes] = await Promise.all([
        fetch("/api/stripe/account"),
        fetch("/api/tenant/payment-settings"),
      ]);

      if (accountRes.ok) {
        setStripeAccount(await accountRes.json());
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings({
          requirePayment: data.requirePayment || false,
          paymentType: data.paymentType || "full",
          depositType: data.depositType || "percentage",
          depositValue: data.depositValue || 50,
          payInFullDiscount: data.payInFullDiscount || 0,
        });
      }
    } catch (error) {
      toast.error("Failed to load account settings");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to start Stripe onboarding");
        setConnecting(false);
      }
    } catch (error) {
      toast.error("Failed to connect Stripe");
      setConnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    // Validate Stripe is connected before enabling payments
    if (settings.requirePayment && !isFullySetup) {
      toast.error("Please connect and complete Stripe setup before enabling payments");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tenant/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Payment settings saved successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-[22px] sm:text-2xl font-bold">Account</h1>
          <p className="text-[13px] sm:text-sm text-muted-foreground">Manage your payment account and settings</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConnected = stripeAccount?.connected;
  const isFullySetup = stripeAccount?.chargesEnabled && stripeAccount?.payoutsEnabled;

  // Calculate example amounts for preview
  const exampleServicePrice = 10000; // $100
  const depositAmount = settings.depositType === "percentage"
    ? Math.round(exampleServicePrice * (settings.depositValue / 100))
    : settings.depositValue;
  const fullAmountWithDiscount = settings.payInFullDiscount > 0
    ? Math.round(exampleServicePrice * (1 - settings.payInFullDiscount / 100))
    : exampleServicePrice;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Account</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground">Manage your payment account and settings</p>
      </div>

      <div className="space-y-6">
        {/* Stripe Connect Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                  <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Stripe Connect</CardTitle>
                  <CardDescription className="hig-caption-1">Receive payments from your clients</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-11 tablet:pl-0">
                {isConnected && (
                  <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    <span className="hidden fold:inline">Refresh</span>
                  </Button>
                )}
                {isFullySetup ? (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : isConnected ? (
                  <Badge variant="warning">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Incomplete
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isConnected ? (
              <>
                {/* Account Details */}
                <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="hig-caption-1 text-muted-foreground">Charges</p>
                    <div className="flex items-center gap-1">
                      {stripeAccount.chargesEnabled ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="hig-footnote font-medium">Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="hig-footnote font-medium">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="hig-caption-1 text-muted-foreground">Payouts</p>
                    <div className="flex items-center gap-1">
                      {stripeAccount.payoutsEnabled ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="hig-footnote font-medium">Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="hig-footnote font-medium">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>
                  {stripeAccount.country && (
                    <div className="space-y-1">
                      <p className="hig-caption-1 text-muted-foreground">Country</p>
                      <p className="hig-footnote font-medium">{stripeAccount.country}</p>
                    </div>
                  )}
                  {stripeAccount.defaultCurrency && (
                    <div className="space-y-1">
                      <p className="hig-caption-1 text-muted-foreground">Currency</p>
                      <p className="hig-footnote font-medium uppercase">{stripeAccount.defaultCurrency}</p>
                    </div>
                  )}
                </div>

                {/* Incomplete Setup Warning */}
                {!isFullySetup && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Setup Incomplete</AlertTitle>
                    <AlertDescription>
                      Your Stripe account setup is incomplete. Please finish the onboarding process to start accepting payments.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {!isFullySetup && (
                    <Button onClick={handleConnectStripe} disabled={connecting}>
                      {connecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plug className="h-4 w-4 mr-2" />
                      )}
                      Complete Setup
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <a
                      href="https://dashboard.stripe.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Stripe Dashboard
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Not Connected State */}
                <p className="text-muted-foreground">
                  Connect your Stripe account to accept credit card payments from clients. Payments are
                  deposited directly into your bank account.
                </p>

                {/* Requirements */}
                <Alert>
                  <AlertTitle className="mb-2">What you'll need to connect:</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Valid government-issued ID</li>
                      <li>Business information (name, address)</li>
                      <li>Bank account for receiving payouts</li>
                      <li>Tax identification number (SSN or EIN)</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Button onClick={handleConnectStripe} disabled={connecting} size="lg">
                  {connecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Connect Stripe Account
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                  <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription className="hig-caption-1">Configure how you collect payments from customers</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Require Payment Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requirePayment" className="font-medium">Require Payment for Bookings</Label>
                <p className="text-sm text-muted-foreground">
                  Customers must pay when booking an appointment
                </p>
              </div>
              <Switch
                id="requirePayment"
                checked={settings.requirePayment}
                onCheckedChange={(checked) => handleSettingChange("requirePayment", checked)}
                disabled={!isFullySetup}
              />
            </div>

            {!isFullySetup && settings.requirePayment === false && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Connect your Stripe account above to enable payment collection.
                </AlertDescription>
              </Alert>
            )}

            {settings.requirePayment && (
              <>
                <Separator />

                {/* Payment Type */}
                <div className="space-y-3">
                  <Label className="font-medium">Payment Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSettingChange("paymentType", "full")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        settings.paymentType === "full"
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Full Payment</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer pays the entire amount upfront
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSettingChange("paymentType", "deposit")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        settings.paymentType === "deposit"
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Deposit</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer pays a deposit, balance due later
                      </p>
                    </button>
                  </div>
                </div>

                {/* Deposit Configuration */}
                {settings.paymentType === "deposit" && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
                    <Label className="font-medium">Deposit Amount</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="depositType" className="text-sm text-muted-foreground">Type</Label>
                        <Select
                          value={settings.depositType}
                          onValueChange={(v) => handleSettingChange("depositType", v)}
                        >
                          <SelectTrigger id="depositType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="depositValue" className="text-sm text-muted-foreground">
                          {settings.depositType === "percentage" ? "Percentage" : "Amount"}
                        </Label>
                        <div className="relative">
                          {settings.depositType === "fixed" && (
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          )}
                          <Input
                            id="depositValue"
                            type="number"
                            min={settings.depositType === "percentage" ? 1 : 100}
                            max={settings.depositType === "percentage" ? 99 : undefined}
                            step={settings.depositType === "percentage" ? 1 : 100}
                            value={settings.depositType === "fixed"
                              ? (settings.depositValue / 100).toFixed(2)
                              : settings.depositValue}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (settings.depositType === "fixed") {
                                handleSettingChange("depositValue", Math.round(val * 100));
                              } else {
                                handleSettingChange("depositValue", Math.round(val));
                              }
                            }}
                            className={settings.depositType === "fixed" ? "pl-8" : ""}
                          />
                          {settings.depositType === "percentage" && (
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Example: For a $100 service, deposit would be{" "}
                      <span className="font-medium text-foreground">
                        ${(depositAmount / 100).toFixed(2)}
                      </span>
                      , balance due:{" "}
                      <span className="font-medium text-foreground">
                        ${((exampleServicePrice - depositAmount) / 100).toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}

                <Separator />

                {/* Pay-in-Full Discount */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="payInFullDiscount" className="font-medium">Pay-in-Full Discount</Label>
                      <p className="text-sm text-muted-foreground">
                        {settings.paymentType === "deposit"
                          ? "Offer a discount when customers pay the full amount instead of just the deposit"
                          : "Offer a discount for paying upfront"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 max-w-xs">
                    <Input
                      id="payInFullDiscount"
                      type="number"
                      min={0}
                      max={15}
                      step={1}
                      value={settings.payInFullDiscount}
                      onChange={(e) => handleSettingChange("payInFullDiscount", Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">% off (max 15%)</span>
                  </div>
                  {settings.payInFullDiscount > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Example: For a $100 service, full payment with {settings.payInFullDiscount}% discount:{" "}
                      <span className="font-medium text-green-600">
                        ${(fullAmountWithDiscount / 100).toFixed(2)}
                      </span>
                      {" "}(saves ${((exampleServicePrice - fullAmountWithDiscount) / 100).toFixed(2)})
                    </p>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Terminal Readers Section */}
        <TerminalReaders isStripeConnected={isFullySetup} />

        {/* Reader Recommendations */}
        <ReaderRecommendations />

        {/* Mobile Tap to Pay Info */}
        <TapToPayInfo />
      </div>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div>
            <h1 className="text-[22px] sm:text-2xl font-bold">Account</h1>
            <p className="text-[13px] sm:text-sm text-muted-foreground">Manage your payment account and settings</p>
          </div>
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}
