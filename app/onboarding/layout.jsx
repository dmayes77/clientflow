"use client";

import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, CreditCard, Settings, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ONBOARDING_STEPS = [
  {
    path: "/onboarding/create-org",
    label: "Create Business",
    description: "Name your business",
    icon: Building2,
  },
  {
    path: "/onboarding/payment",
    label: "Choose Plan",
    description: "Select subscription",
    icon: CreditCard,
  },
  {
    path: "/onboarding/setup",
    label: "Business Details",
    description: "Configure your business",
    icon: Settings,
  },
  {
    path: "/onboarding/complete",
    label: "Complete",
    description: "You're all set!",
    icon: CheckCircle,
  },
];

export default function OnboardingLayout({ children }) {
  const pathname = usePathname();

  const getCurrentStep = () => {
    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/create-org")) {
      return 0;
    }
    if (pathname.startsWith("/onboarding/payment")) {
      return 1;
    }
    if (pathname.startsWith("/onboarding/setup")) {
      return 2;
    }
    if (pathname.startsWith("/onboarding/complete")) {
      return 3;
    }
    return 0;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary">ClientFlow</h1>
          <p className="text-sm text-muted-foreground">Welcome to your business management platform</p>
        </div>

        {/* Stepper */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {ONBOARDING_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isLast = index === ONBOARDING_STEPS.length - 1;

                return (
                  <div key={step.path} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                          isCompleted && "border-green-500 bg-green-500 text-white",
                          isActive && "border-primary bg-primary text-white",
                          !isActive && !isCompleted && "border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="mt-2 hidden text-center sm:block">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isActive && "text-primary",
                            isCompleted && "text-green-500",
                            !isActive && !isCompleted && "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>

                    {!isLast && (
                      <div
                        className={cn(
                          "mx-2 h-0.5 flex-1 transition-colors",
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

        {/* Content */}
        <Card>
          <CardContent className="p-6 sm:p-8">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
