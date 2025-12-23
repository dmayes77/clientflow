"use client";

import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  CreditCard,
  CheckCircle,
  Loader2,
  ExternalLink,
  Crown,
  Zap,
  Users,
  Calendar,
  FileText,
  Key,
  Globe,
  Headphones,
  AlertTriangle,
} from "lucide-react";
import { useTenant, useCreatePortalSession } from "@/lib/hooks";

const PLAN_FEATURES = [
  { icon: Calendar, label: "Unlimited bookings" },
  { icon: Users, label: "Unlimited clients" },
  { icon: FileText, label: "Invoice management" },
  { icon: Key, label: "API access" },
  { icon: Globe, label: "Custom booking page" },
  { icon: Zap, label: "Webhook integrations" },
  { icon: CreditCard, label: "Payment processing" },
  { icon: Receipt, label: "Financial reports" },
  { icon: Headphones, label: "Priority support" },
];

const getStatusVariant = (status) => {
  switch (status) {
    case "active":
      return "success";
    case "trialing":
      return "info";
    case "past_due":
      return "warning";
    case "canceled":
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past Due";
    case "canceled":
    case "cancelled":
      return "Cancelled";
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  }
};

export function BillingSettings() {
  const { data: tenant, isLoading: loading, isError } = useTenant();
  const createPortalSession = useCreatePortalSession();

  if (isError) {
    toast.error("Failed to load billing information");
  }

  const openCustomerPortal = async () => {
    try {
      const { url } = await createPortalSession.mutateAsync();
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || "Failed to open billing portal");
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

  const subscriptionStatus = tenant?.subscriptionStatus || "trialing";
  const subscription = tenant?.subscription;
  const isPastDue = subscriptionStatus === "past_due";
  const isCanceled = subscriptionStatus === "canceled" || subscriptionStatus === "cancelled";

  return (
    <div className="space-y-6">
      {/* Past Due Warning */}
      {isPastDue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Required</AlertTitle>
          <AlertDescription>
            Your subscription payment is past due. Please update your payment method to continue using ClientFlow.
          </AlertDescription>
        </Alert>
      )}

      {/* Canceled Warning */}
      {isCanceled && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Subscription Cancelled</AlertTitle>
          <AlertDescription>
            Your subscription has been cancelled. Reactivate to continue using all features.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Current Plan
              </CardTitle>
              <CardDescription className="hig-caption-1">Your subscription and billing details</CardDescription>
            </div>
            <Badge variant={getStatusVariant(subscriptionStatus)}>
              {getStatusLabel(subscriptionStatus)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
            <div>
              <h3 className="hig-headline">ClientFlow Professional</h3>
              <p className="text-muted-foreground">
                <span className="text-3xl font-bold text-foreground">$149</span>
                <span className="text-muted-foreground">/month</span>
              </p>
            </div>
            {subscription?.currentPeriodEnd && (
              <div className="tablet:text-right">
                <p className="hig-caption-1 text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? "Access until" : "Next billing date"}
                </p>
                <p className="font-medium hig-footnote">
                  {format(new Date(subscription.currentPeriodEnd * 1000), "MMMM d, yyyy")}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Plan Features */}
          <div>
            <h4 className="mb-4 hig-subheadline">Plan includes:</h4>
            <div className="grid grid-cols-1 fold:grid-cols-2 tablet:grid-cols-3 gap-3">
              {PLAN_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 hig-footnote">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Billing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Billing Management
          </CardTitle>
          <CardDescription className="hig-caption-1">Manage your payment methods and billing history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenant?.stripeCustomerId ? (
            <>
              <p className="hig-footnote text-muted-foreground">
                Access the billing portal to update your payment method, view invoices, and manage your subscription.
              </p>
              <Button onClick={openCustomerPortal} disabled={createPortalSession.isPending} className="w-full tablet:w-auto">
                {createPortalSession.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Open Billing Portal
              </Button>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Billing Not Set Up</AlertTitle>
              <AlertDescription className="hig-footnote">
                Your billing account hasn't been configured yet. This typically happens automatically when you
                subscribe to a plan. If you believe this is an error, please contact support.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Info */}
      <Card>
        <CardHeader>
          <CardTitle className="hig-subheadline">Need to cancel?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="hig-footnote text-muted-foreground mb-4">
            You can cancel your subscription at any time through the billing portal. If you cancel, you'll continue
            to have access until the end of your current billing period.
          </p>
          <Alert>
            <AlertDescription className="hig-footnote">
              Before canceling, consider reaching out to our support team. We'd love to help resolve any issues
              you may be experiencing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
