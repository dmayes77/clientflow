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
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSignupState } from "@/lib/signup-state";
import { usePlans, useCreateCheckoutSession } from "@/lib/hooks";
import { formatWholeDollars } from "@/lib/formatters";

export default function Step3Page() {
  const router = useRouter();
  const { isLoaded, orgId, userId } = useAuth();
  const [loading, setLoading] = useState(true);

  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const createCheckoutSession = useCreateCheckoutSession();

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

    try {
      const data = await createCheckoutSession.mutateAsync({
        priceId,
        successUrl: `${window.location.origin}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/signup/step-3`,
      });

      if (!data.url) {
        throw new Error("No checkout URL returned");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error(error.message);
    }
  };

  if (loading || plansLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="hig-title-2 font-semibold text-gray-900 dark:text-white">No Plans Available</h2>
          <p className="mt-1 hig-caption-1 text-gray-500 dark:text-gray-400">
            Please contact support or check back later.
          </p>
        </div>
        <div className="pt-1">
          <button
            type="button"
            onClick={() => router.push("/signup/step-2")}
            className="min-h-11 flex items-center gap-2 hig-body text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 active:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-500" />
        </div>
        <h2 className="hig-title-2 font-semibold text-gray-900 dark:text-white">Choose your plan</h2>
        <p className="mt-1 hig-caption-1 text-gray-500 dark:text-gray-400">
          Select a plan to start your free trial
        </p>
      </div>

      {/* Trial badge */}
      <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl">
        <Gift className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="hig-caption-1 font-medium text-green-700 dark:text-green-300">
          30-day free trial • No charge until trial ends
        </span>
      </div>

      {/* Plan cards */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "p-4 rounded-2xl border-2 transition-colors",
              plan.isDefault
                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-700/50"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <span className="hig-body font-semibold text-gray-900 dark:text-white">
                  {plan.name}
                </span>
                {plan.description && (
                  <p className="hig-caption-1 text-gray-500 dark:text-gray-400 mt-0.5">
                    {plan.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="hig-title-1 font-bold text-gray-900 dark:text-white">
                  {formatWholeDollars(plan.priceMonthly)}
                  <span className="hig-caption-1 font-normal text-gray-500 dark:text-gray-400">/mo</span>
                </div>
                {plan.priceYearly && (
                  <div className="hig-caption-2 text-gray-500 dark:text-gray-400">
                    or {formatWholeDollars(plan.priceYearly)}/yr
                  </div>
                )}
              </div>
            </div>

            {plan.features && plan.features.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {plan.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 hig-caption-2 text-gray-600 dark:text-gray-300"
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
              disabled={createCheckoutSession.isPending}
              className={cn(
                "w-full h-11 text-white hig-body font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2",
                plan.isDefault
                  ? "bg-violet-600 hover:bg-violet-700 active:bg-violet-800"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                createCheckoutSession.isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              {createCheckoutSession.isPending ? (
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
        <div className="flex items-center gap-1.5 hig-caption-2 text-gray-500 dark:text-gray-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Secure checkout</span>
        </div>
        <div className="hig-caption-2 text-gray-500 dark:text-gray-400">Cancel anytime</div>
      </div>

      {/* Back button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => router.push("/signup/step-2")}
          disabled={createCheckoutSession.isPending}
          className="min-h-11 flex items-center gap-2 hig-body text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 active:text-gray-800 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
    </div>
  );
}
