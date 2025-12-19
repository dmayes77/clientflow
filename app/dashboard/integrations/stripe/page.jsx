"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Clock,
  Globe,
  AlertTriangle,
  Plug,
  Settings,
  Save,
  Percent,
  Banknote,
  ChevronLeft,
  Unlink,
  CalendarCheck,
  LogIn,
  Smartphone,
} from "lucide-react";
import { TerminalReaders } from "@/app/dashboard/account/components/TerminalReaders";

const STRIPE_FEATURES = [
  { icon: CreditCard, label: "Accept credit & debit cards" },
  { icon: Smartphone, label: "In-person payments with card readers" },
  { icon: Globe, label: "Support multiple currencies" },
  { icon: Shield, label: "PCI-compliant security" },
  { icon: Clock, label: "Automatic payment collection" },
  { icon: DollarSign, label: "Direct deposits to your bank" },
];

export default function StripeIntegrationPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [account, setAccount] = useState(null);
  const [settings, setSettings] = useState({
    requirePayment: false,
    paymentType: "full",
    depositType: "percentage",
    depositValue: 50,
    payInFullDiscount: 0,
    balanceDueAt: "completion",
  });

  useEffect(() => {
    fetchData();

    // Show success message if returning from Stripe OAuth
    if (searchParams.get("success") === "true") {
      toast.success("Stripe account connected successfully!");
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/integrations/stripe");
    }

    // Show error message if OAuth failed
    const error = searchParams.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, "", "/dashboard/integrations/stripe");
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [accountRes, settingsRes] = await Promise.all([
        fetch("/api/stripe/account"),
        fetch("/api/tenant/payment-settings"),
      ]);

      if (accountRes.ok) {
        setAccount(await accountRes.json());
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings({
          requirePayment: data.requirePayment || false,
          paymentType: data.paymentType || "full",
          depositType: data.depositType || "percentage",
          depositValue: data.depositValue || 50,
          payInFullDiscount: data.payInFullDiscount || 0,
          balanceDueAt: data.balanceDueAt || "completion",
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

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Stripe account? This will disable payment collection.")) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch("/api/stripe/connect/disconnect", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Stripe account disconnected");
        setAccount(null);
        setSettings((prev) => ({ ...prev, requirePayment: false }));
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to disconnect Stripe");
      }
    } catch (error) {
      toast.error("Failed to disconnect Stripe");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    const isFullySetup = account?.chargesEnabled && account?.payoutsEnabled;

    // Validate Stripe is connected before enabling payments
    if (settings.requirePayment && !isFullySetup) {
      toast.error("Please connect and complete Stripe setup before enabling payments");
      return;
    }

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/tenant/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success("Payment settings saved successfully");
        setSaved(true);
        // Reset saved state after 10 seconds
        setTimeout(() => setSaved(false), 10000);
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/integrations">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        </div>
        <div>
          <h1 className="text-[22px] sm:text-2xl font-bold">Stripe Payments</h1>
          <p className="text-[13px] sm:text-sm text-muted-foreground">Accept payments from your clients</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConnected = account?.connected;
  const isFullySetup = account?.chargesEnabled && account?.payoutsEnabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/integrations">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Stripe Payments</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground">Accept payments from your clients</p>
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
                  <CardDescription className="hig-caption-1">Connect your Stripe account</CardDescription>
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
                      {account.chargesEnabled ? (
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
                      {account.payoutsEnabled ? (
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
                  {account.country && (
                    <div className="space-y-1">
                      <p className="hig-caption-1 text-muted-foreground">Country</p>
                      <p className="hig-footnote font-medium">{account.country}</p>
                    </div>
                  )}
                  {account.defaultCurrency && (
                    <div className="space-y-1">
                      <p className="hig-caption-1 text-muted-foreground">Currency</p>
                      <p className="hig-footnote font-medium uppercase">{account.defaultCurrency}</p>
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
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-destructive hover:text-destructive"
                  >
                    {disconnecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4 mr-2" />
                    )}
                    Disconnect
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
                            min={settings.depositType === "percentage" ? 1 : 1}
                            max={settings.depositType === "percentage" ? 99 : undefined}
                            step={settings.depositType === "percentage" ? 1 : 1}
                            value={settings.depositType === "fixed"
                              ? (settings.depositValue ? (settings.depositValue / 100) : "")
                              : (settings.depositValue || "")}
                            onChange={(e) => {
                              const rawVal = e.target.value;
                              if (rawVal === "") {
                                handleSettingChange("depositValue", 0);
                                return;
                              }
                              const val = parseFloat(rawVal);
                              if (!isNaN(val)) {
                                if (settings.depositType === "fixed") {
                                  handleSettingChange("depositValue", Math.round(val * 100));
                                } else {
                                  handleSettingChange("depositValue", Math.round(val));
                                }
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
                        ${settings.depositType === "percentage"
                          ? (100 * (settings.depositValue || 50) / 100).toFixed(2)
                          : ((settings.depositValue || 5000) / 100).toFixed(2)}
                      </span>
                      , balance due:{" "}
                      <span className="font-medium text-foreground">
                        ${settings.depositType === "percentage"
                          ? (100 - (100 * (settings.depositValue || 50) / 100)).toFixed(2)
                          : ((10000 - (settings.depositValue || 5000)) / 100).toFixed(2)}
                      </span>
                    </p>

                    {/* Balance Due Timing */}
                    <div className="space-y-3 pt-2">
                      <Label className="font-medium">Balance Due</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleSettingChange("balanceDueAt", "arrival")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            settings.balanceDueAt === "arrival"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <LogIn className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">Upon Arrival</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Customer pays balance when they arrive
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSettingChange("balanceDueAt", "completion")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            settings.balanceDueAt === "completion"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <CalendarCheck className="h-4 w-4 text-green-600" />
                            <span className="font-medium">After Completion</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Customer pays balance after services
                          </p>
                        </button>
                      </div>
                    </div>
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
                      value={settings.payInFullDiscount || ""}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        if (rawVal === "") {
                          handleSettingChange("payInFullDiscount", 0);
                          return;
                        }
                        const val = parseInt(rawVal);
                        if (!isNaN(val)) {
                          handleSettingChange("payInFullDiscount", Math.min(15, Math.max(0, val)));
                        }
                      }}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">% off (max 15%)</span>
                  </div>
                  {(settings.payInFullDiscount || 0) > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Example: For a $100 service, full payment with {settings.payInFullDiscount}% discount:{" "}
                      <span className="font-medium text-green-600">
                        ${(100 * (1 - (settings.payInFullDiscount || 0) / 100)).toFixed(2)}
                      </span>
                      {" "}(saves ${(settings.payInFullDiscount || 0).toFixed(2)})
                    </p>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className={saved ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saved ? "Saved" : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Readers */}
        <TerminalReaders isStripeConnected={isFullySetup} />

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Features</CardTitle>
            <CardDescription>What you can do with Stripe payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 fold:grid-cols-2 tablet:grid-cols-3 gap-4">
              {STRIPE_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <feature.icon className="h-5 w-5 text-purple-500 shrink-0" />
                  <span className="hig-footnote">{feature.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
