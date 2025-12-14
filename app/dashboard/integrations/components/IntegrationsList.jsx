"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

const STRIPE_FEATURES = [
  { icon: CreditCard, label: "Accept credit & debit cards" },
  { icon: Globe, label: "Support multiple currencies" },
  { icon: Shield, label: "PCI-compliant security" },
  { icon: Clock, label: "Automatic payment collection" },
  { icon: DollarSign, label: "Direct deposits to your bank" },
];

export function IntegrationsList() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    fetchAccountStatus();

    // Show success message if returning from Stripe onboarding
    if (searchParams.get("success") === "true") {
      toast.success("Stripe account connected successfully!");
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/integrations");
    }
  }, [searchParams]);

  const fetchAccountStatus = async () => {
    try {
      const res = await fetch("/api/stripe/account");
      if (res.ok) {
        setAccount(await res.json());
      }
    } catch (error) {
      toast.error("Failed to load Stripe account status");
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = account?.connected;
  const isFullySetup = account?.chargesEnabled && account?.payoutsEnabled;

  return (
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
                <CardTitle>Stripe Payments</CardTitle>
                <CardDescription className="hig-caption-1">Accept payments from your clients</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-11 tablet:pl-0">
              {isConnected && (
                <Button variant="outline" size="sm" onClick={fetchAccountStatus}>
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

      {/* More Integrations Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">More Integrations Coming Soon</CardTitle>
          <CardDescription>We're working on adding more integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
            {["Google Calendar", "Zoom", "QuickBooks", "Mailchimp"].map((name) => (
              <div
                key={name}
                className="flex items-center justify-center p-4 rounded-lg border border-dashed text-muted-foreground hig-footnote"
              >
                {name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
