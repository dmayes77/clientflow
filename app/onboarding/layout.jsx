"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Clock, Briefcase, Eye, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ONBOARDING_STEPS = [
  {
    step: 4,
    path: "/onboarding/step-4",
    label: "Business Profile",
    description: "Logo & contact info",
    icon: Building2,
  },
  {
    step: 5,
    path: "/onboarding/step-5",
    label: "Availability",
    description: "Working hours",
    icon: Clock,
  },
  {
    step: 6,
    path: "/onboarding/step-6",
    label: "First Service",
    description: "Create a service",
    icon: Briefcase,
  },
  {
    step: 7,
    path: "/onboarding/step-7",
    label: "Preview",
    description: "Review & launch",
    icon: Eye,
  },
];

export default function OnboardingLayout({ children }) {
  const pathname = usePathname();

  const getCurrentStep = () => {
    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/step-4")) {
      return 4;
    }
    if (pathname.startsWith("/onboarding/step-5")) {
      return 5;
    }
    if (pathname.startsWith("/onboarding/step-6")) {
      return 6;
    }
    if (pathname.startsWith("/onboarding/step-7")) {
      return 7;
    }
    // Legacy routes - redirect to new flow
    if (pathname.includes("/create-org") || pathname.includes("/payment")) {
      return 4;
    }
    if (pathname.includes("/setup")) {
      return 4;
    }
    if (pathname.includes("/complete")) {
      return 7;
    }
    return 4;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hig-safe-top hig-safe-bottom">
      <div className="mx-auto max-w-4xl px-4 py-6 fold:py-8 tablet:px-6 desktop:px-8">
        {/* Logo */}
        <div className="mb-6 fold:mb-8 text-center">
          <Link href="/dashboard" className="inline-block">
            <h1 className="hig-large-title tablet:text-2xl desktop:text-3xl font-bold tracking-tight">
              <span className="text-slate-800 dark:text-slate-200">Client</span>
              <span className="text-primary">Flow</span>
            </h1>
          </Link>
          <p className="hig-subhead tablet:text-sm text-muted-foreground mt-1">Let&apos;s set up your business</p>
        </div>

        {/* Stepper - HIG touch targets */}
        <Card className="mb-6 fold:mb-8">
          <CardContent className="py-4 fold:py-5 tablet:py-6">
            <div className="flex items-center justify-between overflow-x-auto">
              {ONBOARDING_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.step === currentStep;
                const isCompleted = step.step < currentStep;
                const isLast = index === ONBOARDING_STEPS.length - 1;

                return (
                  <div key={step.path} className="flex flex-1 items-center min-w-0">
                    <div className="flex flex-col items-center">
                      {/* 44px touch target on mobile (w-11 h-11 = 44px) */}
                      <div
                        className={cn(
                          "flex h-11 w-11 fold:h-10 fold:w-10 tablet:h-10 tablet:w-10 items-center justify-center rounded-full border-2 transition-colors",
                          isCompleted && "border-green-500 bg-green-500 text-white",
                          isActive && "border-primary bg-primary text-white",
                          !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 fold:h-4 fold:w-4" />
                        ) : (
                          <Icon className="h-5 w-5 fold:h-4 fold:w-4" />
                        )}
                      </div>
                      {/* HIG caption labels - hidden on smallest screens */}
                      <div className="mt-1.5 hidden fold:block text-center">
                        <p
                          className={cn(
                            "hig-caption-1 tablet:text-xs font-medium",
                            isActive && "text-primary",
                            isCompleted && "text-green-500",
                            !isActive && !isCompleted && "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>

                    {!isLast && (
                      <div
                        className={cn(
                          "mx-1 fold:mx-1.5 tablet:mx-2 h-0.5 flex-1 transition-colors min-w-3 fold:min-w-4 rounded-full",
                          isCompleted ? "bg-green-500" : "bg-muted-foreground/30"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Content - iOS-style card with proper padding */}
        <Card className="rounded-2xl shadow-lg shadow-black/5">
          <CardContent className="p-5 fold:p-6 tablet:p-8">{children}</CardContent>
        </Card>

        {/* Skip to dashboard link - HIG footnote with 44px touch target */}
        <p className="mt-6 fold:mt-8 text-center hig-footnote tablet:text-sm text-muted-foreground">
          Want to explore first?{" "}
          <Link
            href="/dashboard"
            className="text-primary hover:underline font-semibold inline-flex items-center min-h-11 tablet:min-h-0"
          >
            Skip to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
