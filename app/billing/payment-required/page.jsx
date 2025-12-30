"use client";

import { useEffect } from "react";
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
import { useTenantStatus } from "@/lib/hooks/use-tenant";
import { useCreateBillingPortal } from "@/lib/hooks/use-stripe";

export default function PaymentRequiredPage() {
  const router = useRouter();
  const { isLoaded, orgId, signOut } = useAuth();

  const { data: subscriptionInfo, isLoading } = useTenantStatus();

  useEffect(() => {
    if (subscriptionInfo) {
      // If subscription is active, redirect to dashboard
      if (subscriptionInfo.subscriptionStatus === "active" || subscriptionInfo.subscriptionStatus === "trialing") {
        router.push("/dashboard");
      }
    }
  }, [subscriptionInfo, router]);

  const updatePaymentMutation = useCreateBillingPortal();

  const handleUpdatePayment = async () => {
    try {
      const data = await updatePaymentMutation.mutateAsync();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback to retry page
        router.push("/billing/retry");
      }
    } catch (error) {
      console.error("Error:", error);
      router.push("/billing/retry");
    }
  };

  if (isLoading || !isLoaded) {
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
          <h1 className="hig-title-1 font-bold">
            <span className="text-foreground">Client</span>
            <span className="text-primary">Flow</span>
          </h1>
        </div>

        <Card className="border-destructive/50">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="hig-title-2">Payment Required</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="text-center">
              <p className="hig-caption1 text-muted-foreground mb-3">
                {subscriptionInfo?.subscriptionStatus === "past_due"
                  ? "Your payment is past due. Please update your payment method to continue using ClientFlow."
                  : subscriptionInfo?.subscriptionStatus === "canceled"
                    ? "Your subscription has been canceled. Reactivate to continue using ClientFlow."
                    : "There's an issue with your subscription. Please update your payment details."}
              </p>

              {subscriptionInfo?.currentPeriodEnd && (
                <p className="hig-caption-2 text-muted-foreground">
                  {subscriptionInfo.subscriptionStatus === "past_due" && (
                    <>Access will be suspended soon if payment is not received.</>
                  )}
                </p>
              )}
            </div>

            <Button
              onClick={handleUpdatePayment}
              disabled={updatePaymentMutation.isPending}
              className="w-full h-11 hig-body font-semibold rounded-xl"
              size="lg"
            >
              {updatePaymentMutation.isPending ? (
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
                className="hig-caption1 text-primary hover:underline"
              >
                View billing details
              </Link>

              <button
                onClick={() => signOut()}
                className="hig-caption1 text-muted-foreground hover:text-foreground"
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
            className="inline-flex items-center gap-1.5 hig-caption-2 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Need help? Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
