"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CreditCard,
  Loader2,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

export default function PaymentRequiredPage() {
  const router = useRouter();
  const { isLoaded, orgId, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/tenant/status");
        if (res.ok) {
          const data = await res.json();
          setSubscriptionInfo(data);

          // If subscription is active, redirect to dashboard
          if (data.subscriptionStatus === "active" || data.subscriptionStatus === "trialing") {
            router.push("/dashboard");
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching status:", error);
      }
      setLoading(false);
    };

    if (orgId) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [isLoaded, orgId, router]);

  const handleUpdatePayment = async () => {
    setUpdating(true);

    try {
      const res = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Fallback to retry page
      router.push("/billing/retry");
    } catch (error) {
      console.error("Error:", error);
      router.push("/billing/retry");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-linear-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">
            <span className="text-foreground">Client</span>
            <span className="text-primary">Flow</span>
          </h1>
        </div>

        <Card className="border-destructive/50">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">Payment Required</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="text-center">
              <p className="text-[13px] text-muted-foreground mb-3">
                {subscriptionInfo?.subscriptionStatus === "past_due"
                  ? "Your payment is past due. Please update your payment method to continue using ClientFlow."
                  : subscriptionInfo?.subscriptionStatus === "canceled"
                    ? "Your subscription has been canceled. Reactivate to continue using ClientFlow."
                    : "There's an issue with your subscription. Please update your payment details."}
              </p>

              {subscriptionInfo?.currentPeriodEnd && (
                <p className="text-[11px] text-muted-foreground">
                  {subscriptionInfo.subscriptionStatus === "past_due" && (
                    <>Access will be suspended soon if payment is not received.</>
                  )}
                </p>
              )}
            </div>

            <Button
              onClick={handleUpdatePayment}
              disabled={updating}
              className="w-full h-11 text-[15px] font-semibold rounded-xl"
              size="lg"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Update Payment Method
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="flex flex-col gap-2 text-center">
              <Link
                href="/dashboard/settings/billing"
                className="text-[13px] text-primary hover:underline"
              >
                View billing details
              </Link>

              <button
                onClick={() => signOut()}
                className="text-[13px] text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Help section */}
        <div className="mt-5 text-center">
          <a
            href="mailto:support@getclientflow.app"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Need help? Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
