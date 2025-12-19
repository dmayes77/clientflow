"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CreditCard,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
} from "lucide-react";

const PLAN = {
  id: "professional",
  name: "Professional",
  price: 149,
  priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL,
  description: "Everything you need to grow your business",
  features: [
    "Unlimited bookings",
    "Unlimited clients",
    "Online scheduling page",
    "Email notifications",
    "Calendar integrations",
    "Payment processing",
  ],
};

export default function RetryPaymentPage() {
  const router = useRouter();
  const { isLoaded, orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/tenant/status");
        if (res.ok) {
          const data = await res.json();

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

  const handleReactivate = async () => {
    setRedirecting(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: PLAN.priceId,
          successUrl: `${window.location.origin}/dashboard?reactivated=true`,
          cancelUrl: `${window.location.origin}/billing/retry`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create checkout");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      toast.error(error.message);
      setRedirecting(false);
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

        <Card>
          <CardHeader className="text-center pb-3">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Reactivate Your Account</CardTitle>
            <CardDescription className="text-[13px]">
              Continue using ClientFlow with our Professional plan
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Plan card */}
            <div className="p-4 rounded-2xl border-2 border-violet-500 bg-violet-50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="text-[15px] font-semibold text-gray-900">{PLAN.name}</span>
                  <p className="text-[13px] text-gray-500 mt-0.5">{PLAN.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">
                    ${PLAN.price}
                    <span className="text-[13px] font-normal text-gray-500">/mo</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {PLAN.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-1.5 text-[11px] text-gray-600"
                  >
                    <Check className="w-3 h-3 shrink-0 text-violet-500" />
                    <span className="truncate">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleReactivate}
                disabled={redirecting}
                className={`w-full h-11 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-[15px] font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                  redirecting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {redirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Redirecting to checkout...</span>
                  </>
                ) : (
                  <>
                    Reactivate Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure checkout</span>
              </div>
              <div>Cancel anytime</div>
            </div>

            {/* Back link */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => router.push("/billing/payment-required")}
                disabled={redirecting}
                className="min-h-11 flex items-center gap-2 text-[15px] text-gray-600 hover:text-gray-900 active:text-gray-800 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
