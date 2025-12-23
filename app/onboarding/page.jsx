"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useOnboardingProgress } from "@/lib/hooks";

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, orgId, userId } = useAuth();
  const { data: progress, isLoading, isError } = useOnboardingProgress();

  useEffect(() => {
    if (!isLoaded) return;

    // Not authenticated - go to signup
    if (!userId) {
      router.push("/signup");
      return;
    }

    // No org - go to signup step 2
    if (!orgId) {
      router.push("/signup/step-2");
      return;
    }

    // Wait for progress data to load
    if (isLoading) return;

    // If onboarding complete, go to dashboard
    if (progress?.isComplete) {
      router.push("/dashboard");
      return;
    }

    // Go to current step (minimum step 4)
    const step = Math.max(progress?.step || 4, 4);
    router.push(`/onboarding/step-${step}`);
  }, [isLoaded, userId, orgId, router, progress, isLoading, isError]);

  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
