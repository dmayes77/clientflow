"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoaded, orgId, userId } = useAuth();

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

    // Fetch current onboarding step
    const checkProgress = async () => {
      try {
        const res = await fetch("/api/onboarding/progress");
        if (res.ok) {
          const data = await res.json();

          // If onboarding complete, go to dashboard
          if (data.isComplete) {
            router.push("/dashboard");
            return;
          }

          // Go to current step (minimum step 4)
          const step = Math.max(data.step || 4, 4);
          router.push(`/onboarding/step-${step}`);
        } else {
          // Default to step 4
          router.push("/onboarding/step-4");
        }
      } catch (error) {
        console.error("Error checking onboarding progress:", error);
        router.push("/onboarding/step-4");
      }
    };

    checkProgress();
  }, [isLoaded, userId, orgId, router]);

  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
