"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Check,
  Loader2,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSignupState } from "@/lib/signup-state";

function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function Step3Page() {
  const router = useRouter();
  const { isLoaded, orgId, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [redirecting, setRedirecting] = useState(false);

  // Fetch plans from database
  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      }
    }
    fetchPlans();
  }, []);

  // Redirect if not authenticated or no org
  useEffect(() => {
    if (!isLoaded) return;

    // Check signup state first - if step >= 3, user completed step 2
    const state = getSignupState();
    const hasCompletedStep2 = state.step >= 3 || state.orgId;

    if (!userId && !hasCompletedStep2) {
      router.push("/signup/step-1");
      return;
    }

    // Check if org exists (either from Clerk or signup state)
    if (orgId || hasCompletedStep2) {
      setLoading(false);
    } else {
      // Need to complete step 2 first
      router.push("/signup/step-2");
    }
  }, [isLoaded, userId, orgId, router]);

  const handleSelectPlan = async (plan) => {
    const priceId = plan.stripePriceId;

    if (!priceId) {
      toast.error("This plan is not configured for checkout.");
      return;
    }

    setRedirecting(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/signup/step-3`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      if (!data.url) {
        throw new Error("No checkout URL returned");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error(error.message);
      setRedirecting(false);
    }
  };

  if (loading || plans.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Choose your plan</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          Start with a 30-day free trial
        </p>
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "p-4 rounded-2xl border-2 transition-colors",
              plan.isDefault
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 bg-white"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <span className="text-[15px] font-semibold text-gray-900">
                  {plan.name}
                </span>
                {plan.description && (
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    {plan.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(plan.priceMonthly)}
                  <span className="text-[13px] font-normal text-gray-500">/mo</span>
                </div>
                {plan.priceYearly && (
                  <div className="text-[11px] text-gray-500">
                    or {formatPrice(plan.priceYearly)}/yr
                  </div>
                )}
              </div>
            </div>

            {plan.features && plan.features.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 text-[11px] text-gray-600"
                  >
                    <Check
                      className={cn(
                        "w-3 h-3 shrink-0",
                        plan.isDefault ? "text-violet-500" : "text-blue-500"
                      )}
                    />
                    <span className="truncate">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => handleSelectPlan(plan)}
              disabled={redirecting}
              className={cn(
                "w-full h-11 text-white text-[15px] font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2",
                plan.isDefault
                  ? "bg-violet-600 hover:bg-violet-700 active:bg-violet-800"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                redirecting && "opacity-50 cursor-not-allowed"
              )}
            >
              {redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Redirecting to checkout...</span>
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure checkout</span>
        </div>
        <div className="text-[11px] text-gray-500">30-day free trial</div>
        <div className="text-[11px] text-gray-500">Cancel anytime</div>
      </div>

      {/* Back button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => router.push("/signup/step-2")}
          disabled={redirecting}
          className="min-h-11 flex items-center gap-2 text-[15px] text-gray-600 hover:text-gray-900 active:text-gray-800 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}
