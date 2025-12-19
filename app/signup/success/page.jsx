"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { clearSignupState } from "@/lib/signup-state";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, orgId } = useAuth();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!isLoaded) return;

    const verifyPayment = async () => {
      if (!sessionId) {
        setStatus("success");
        return;
      }

      try {
        // Verify the checkout session
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);

        if (res.ok) {
          // Clear signup state
          clearSignupState();

          // Update onboarding progress
          await fetch("/api/onboarding/progress", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: 4 }),
          });

          setStatus("success");
        } else {
          const data = await res.json();
          setError(data.error || "Payment verification failed");
          setStatus("error");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        // Still consider it success if session exists
        clearSignupState();
        setStatus("success");
      }
    };

    // Give Stripe webhook time to process
    const timeout = setTimeout(verifyPayment, 1500);
    return () => clearTimeout(timeout);
  }, [isLoaded, sessionId]);

  const handleContinue = () => {
    router.push("/onboarding");
  };

  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">
          Setting up your account...
        </h2>
        <p className="mt-2 text-[13px] text-gray-500">
          This will only take a moment
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-lg">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-1 text-[13px] text-gray-500">{error}</p>
        <button
          onClick={() => router.push("/signup/step-3")}
          className="mt-5 h-11 px-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[15px] font-semibold rounded-xl shadow-md transition-colors"
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
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center ring-4 ring-green-100/50">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-1">
        Welcome to ClientFlow!
      </h2>
      <p className="text-[13px] text-gray-500 mb-1">
        Your account is set up and ready to go.
      </p>
      <p className="text-[11px] text-gray-400 mb-5">
        Your 30-day free trial has started
      </p>

      {/* What's next */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
        <p className="text-[13px] font-medium text-gray-700 mb-2">
          Next, let&apos;s set up your business:
        </p>
        <ul className="space-y-1.5 text-[13px] text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[11px] flex items-center justify-center font-medium">1</span>
            Add your business profile
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[11px] flex items-center justify-center font-medium">2</span>
            Set your availability
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[11px] flex items-center justify-center font-medium">3</span>
            Create your first service
          </li>
        </ul>
      </div>

      <button
        onClick={handleContinue}
        className="w-full h-11 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[15px] font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
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
