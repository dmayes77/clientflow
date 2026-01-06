"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, Loader2, ArrowRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { clearSignupState } from "@/lib/signup-state";
import { useVerifyCheckoutSession, useUpdateOnboardingProgress } from "@/lib/hooks";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, orgId } = useAuth();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const sessionId = searchParams.get("session_id");
  const verifyCheckoutSession = useVerifyCheckoutSession();
  const updateOnboardingProgress = useUpdateOnboardingProgress();

  // Confetti celebration
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    // Fire multiple bursts for a more celebratory effect
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus("success");
        fireConfetti();
        return;
      }

      try {
        // Verify the checkout session
        await verifyCheckoutSession.mutateAsync(sessionId);

        // Clear signup state
        clearSignupState();

        // Update onboarding progress
        await updateOnboardingProgress.mutateAsync({ step: 4 });

        setStatus("success");
        fireConfetti();
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError(err.message || "Failed to verify payment");
        setStatus("error");
      }
    };

    // Give Stripe webhook time to process
    const timeout = setTimeout(verifyPayment, 1500);
    return () => clearTimeout(timeout);
  }, [isLoaded, sessionId, verifyCheckoutSession, updateOnboardingProgress, fireConfetti]);

  const handleContinue = () => {
    router.push("/onboarding");
  };

  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-4" />
        <h2 className="hig-title-2 font-semibold text-gray-900 dark:text-white">
          Setting up your account...
        </h2>
        <p className="mt-2 hig-caption-1 text-gray-500 dark:text-gray-400">
          This will only take a moment
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <span className="hig-title-2 text-red-600 dark:text-red-400">!</span>
        </div>
        <h2 className="hig-title-2 font-semibold text-gray-900 dark:text-white">
          Something went wrong
        </h2>
        <p className="mt-1 hig-caption-1 text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={() => router.push("/signup/step-3")}
          className="mt-5 h-11 px-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      {/* Success animation */}
      <div className="relative inline-block mb-5">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center ring-4 ring-green-100/50 dark:ring-green-900/30">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      <h2 className="hig-title-2 font-bold text-gray-900 dark:text-white mb-1">
        Welcome to ClientFlow!
      </h2>
      <p className="hig-caption-1 text-gray-500 dark:text-gray-400 mb-1">
        Your account is set up and ready to go.
      </p>
      <p className="hig-caption-2 text-gray-400 mb-5">
        Your 30-day free trial has started
      </p>

      {/* What's next */}
      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-5 text-left">
        <p className="hig-caption-1 font-medium text-gray-700 dark:text-gray-200 mb-2">
          Next, let&apos;s set up your business:
        </p>
        <ul className="space-y-1.5 hig-caption-1 text-gray-600 dark:text-gray-300">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hig-caption-2 flex items-center justify-center font-medium">1</span>
            Add your business profile
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hig-caption-2 flex items-center justify-center font-medium">2</span>
            Set your availability
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hig-caption-2 flex items-center justify-center font-medium">3</span>
            Create your first service
          </li>
        </ul>
      </div>

      <button
        onClick={handleContinue}
        className="w-full h-11 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hig-body font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
      >
        Continue Setup
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
