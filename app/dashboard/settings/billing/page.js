"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
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
  ExternalLink,
  Info,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function BillingPage() {
  const { orgId } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const fetchTenant = async () => {
    try {
      const response = await fetch("/api/tenant", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTenant(data);
      }
    } catch (error) {
      console.error("Failed to fetch tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [orgId]);

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to open billing portal",
        color: "red",
      });
      setPortalLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "trialing":
        return "bg-blue-100 text-blue-700";
      case "past_due":
        return "bg-amber-100 text-amber-700";
      case "canceled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "trialing":
        return "Free Trial";
      case "active":
        return "Active";
      case "past_due":
        return "Past Due";
      case "canceled":
        return "Canceled";
      default:
        return status;
    }
  };

  const features = [
    "Unlimited bookings & clients",
    "Visual booking pipeline",
    "Complete CRM system",
    "Payment processing",
    "Invoicing & reporting",
    "Full REST API access",
    "Webhook notifications",
    "Custom integrations",
    "Email & SMS (coming soon)",
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-xs text-zinc-500">Loading billing...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">No subscription found</p>
            <p className="text-xs text-blue-800 mt-1">
              You don't have an active subscription.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Billing & Subscription</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.625rem] font-medium text-zinc-500 uppercase tracking-wide mb-1">
                Current Plan
              </p>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-zinc-900">
                  ClientFlow Professional
                </span>
                <Badge className={cn("text-[0.625rem]", getStatusColor(tenant.subscriptionStatus))}>
                  {getStatusLabel(tenant.subscriptionStatus)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[0.625rem] text-zinc-500 mb-1">Price</p>
              <p className="text-base font-semibold text-zinc-900">
                $149<span className="text-xs font-normal text-zinc-500">/month</span>
              </p>
            </div>
          </div>

          {tenant.subscriptionStatus === "trialing" && (
            <>
              <Separator className="my-4" />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    You're currently on a 14-day free trial. Your card will be charged when the trial ends.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">What's Included</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-xs text-zinc-600">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing Portal */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3">
            <p className="text-xs font-medium text-zinc-900">Payment & Billing Management</p>
            <p className="text-[0.625rem] text-zinc-500 mt-0.5">
              Update your payment method, view billing history, download invoices, and manage your subscription
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={openCustomerPortal}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
            )}
            Manage Payment Method & Invoices
            <ExternalLink className="h-3 w-3 ml-1.5" />
          </Button>
        </CardContent>
      </Card>

      {/* Cancel Info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-zinc-900 mb-1">Need to cancel?</p>
          <p className="text-[0.625rem] text-zinc-500 mb-3">
            You can cancel your subscription at any time from the billing portal. Your access will continue until the end of your current billing period.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={openCustomerPortal}
            disabled={portalLoading}
          >
            {portalLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Go to Billing Portal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
