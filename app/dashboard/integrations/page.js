"use client";

import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "@/components/ui";
import {
  CreditCard,
  AlertCircle,
  Check,
  ExternalLink,
  RefreshCw,
  Loader2,
  Zap,
} from "lucide-react";

export default function IntegrationsPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const fetchAccountStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stripe/account");

      if (response.ok) {
        const data = await response.json();
        setAccount(data);
      } else {
        throw new Error("Failed to fetch account");
      }
    } catch (error) {
      console.error("Error fetching account:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch Stripe account status",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create onboarding link");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      const isConnectError = error.message?.includes("Stripe Connect");
      notifications.show({
        title: "Setup Required",
        message: isConnectError
          ? error.message
          : "Failed to start Stripe onboarding. Please try again.",
        color: "orange",
        autoClose: isConnectError ? false : 5000,
      });
      setConnecting(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading integrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Integrations</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Connect third-party services to extend your platform
          </p>
        </div>
        {account?.connected && (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAccountStatus}
            className="text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Status
          </Button>
        )}
      </div>

      {/* Stripe Connection Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                <CreditCard className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Stripe Payments</CardTitle>
                <p className="text-[0.625rem] text-zinc-500">Accept payments from bookings</p>
              </div>
            </div>
            {account?.connected ? (
              <Badge className="bg-green-100 text-green-700 text-[0.625rem]">
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[0.625rem]">
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {account?.connected ? (
            <>
              <p className="text-xs text-zinc-600">
                Your Stripe account is connected. You can now accept payments for bookings.
              </p>

              {!account.onboardingComplete && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-amber-900">Complete Onboarding</p>
                      <p className="text-[0.625rem] text-amber-800 mt-0.5">
                        Your Stripe account setup is incomplete. Complete the onboarding process to start accepting payments.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={handleConnect}
                        disabled={connecting}
                      >
                        {connecting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                        Complete Setup
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-zinc-900 mb-2">Account Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center",
                      account.onboardingComplete ? "bg-green-100" : "bg-zinc-100"
                    )}>
                      <Check className={cn(
                        "h-3 w-3",
                        account.onboardingComplete ? "text-green-600" : "text-zinc-400"
                      )} />
                    </div>
                    <span className="text-[0.625rem] text-zinc-600">
                      Status: {account.onboardingComplete ? "Active" : "Pending Setup"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center",
                      account.chargesEnabled ? "bg-green-100" : "bg-zinc-100"
                    )}>
                      <Check className={cn(
                        "h-3 w-3",
                        account.chargesEnabled ? "text-green-600" : "text-zinc-400"
                      )} />
                    </div>
                    <span className="text-[0.625rem] text-zinc-600">
                      Charges: {account.chargesEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center",
                      account.payoutsEnabled ? "bg-green-100" : "bg-zinc-100"
                    )}>
                      <Check className={cn(
                        "h-3 w-3",
                        account.payoutsEnabled ? "text-green-600" : "text-zinc-400"
                      )} />
                    </div>
                    <span className="text-[0.625rem] text-zinc-600">
                      Payouts: {account.payoutsEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {account.country && (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center bg-blue-100">
                        <Check className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-[0.625rem] text-zinc-600">
                        Country: {account.country.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                asChild
              >
                <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open Stripe Dashboard
                </a>
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-600">
                Connect your Stripe account to start accepting payments. You'll be redirected to Stripe to complete a secure onboarding process.
              </p>

              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                <p className="text-xs font-medium text-zinc-900 mb-2">What you'll need:</p>
                <ul className="text-[0.625rem] text-zinc-600 space-y-1 list-disc list-inside">
                  <li>Business information and tax details</li>
                  <li>Bank account for receiving payouts</li>
                  <li>Identity verification documents</li>
                </ul>
              </div>

              <Button
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="text-xs"
              >
                {connecting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                )}
                Connect Stripe
              </Button>

              <p className="text-[0.625rem] text-zinc-400 italic">
                By connecting Stripe, you agree to Stripe's Terms of Service and Privacy Policy.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Features Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Payment Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Accept credit and debit card payments",
              "Automatic payment collection on bookings",
              "Secure payment processing with Stripe",
              "Real-time payment status updates",
              "Comprehensive payment reporting",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <span className="text-xs text-zinc-600">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Section */}
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-xs font-medium text-zinc-900 mb-1">More Integrations Coming Soon</p>
            <p className="text-[0.625rem] text-zinc-500">
              QuickBooks, Google Calendar, Zapier, and more
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
