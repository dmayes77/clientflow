"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Account" },
  { number: 2, label: "Business" },
  { number: 3, label: "Payment" },
];

export function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-3 fold:gap-4">
      {STEPS.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              {/* 44px touch target on mobile (w-11 = 44px) */}
              <div
                className={cn(
                  "w-11 h-11 fold:w-10 fold:h-10 tablet:w-9 tablet:h-9 rounded-full flex items-center justify-center",
                  "hig-callout tablet:hig-body font-semibold transition-colors",
                  isCompleted && "bg-green-500 text-white",
                  isActive && "bg-blue-500 text-white",
                  !isActive && !isCompleted && "bg-gray-200 text-gray-500"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 fold:w-4 fold:h-4" />
                ) : (
                  step.number
                )}
              </div>
              {/* HIG caption-1 labels */}
              <span
                className={cn(
                  "mt-1.5 hig-caption-1 tablet:hig-caption2 hidden fold:block",
                  isActive && "text-blue-500 font-semibold",
                  isCompleted && "text-green-600 font-medium",
                  !isActive && !isCompleted && "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  "w-6 fold:w-10 tablet:w-14 h-0.5 mx-1 fold:mx-2 rounded-full",
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
