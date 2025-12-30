"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StepIndicator - Horizontal step progress indicator
 *
 * @param {object} props
 * @param {Array} props.steps - Array of { number, label } or just labels
 * @param {number} props.currentStep - Current step number (1-indexed)
 * @param {string} props.variant - "default" | "compact" (default: "default")
 * @param {string} props.className - Additional classes
 */
export function StepIndicator({
  steps,
  currentStep,
  variant = "default",
  className,
}) {
  const normalizedSteps = steps.map((step, i) => {
    if (typeof step === "string") {
      return { number: i + 1, label: step };
    }
    return { number: step.number ?? i + 1, label: step.label };
  });

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 fold:gap-4",
        className
      )}
    >
      {normalizedSteps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        const isLast = index === normalizedSteps.length - 1;

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "rounded-full flex items-center justify-center font-semibold transition-colors",
                  variant === "compact"
                    ? "w-8 h-8 text-sm"
                    : "w-11 h-11 fold:w-10 fold:h-10 tablet:w-9 tablet:h-9 hig-callout tablet:hig-body",
                  isCompleted && "bg-green-500 text-white",
                  isActive && "bg-blue-500 text-white",
                  !isActive && !isCompleted && "bg-gray-200 text-gray-500"
                )}
              >
                {isCompleted ? (
                  <Check
                    className={cn(
                      variant === "compact" ? "w-4 h-4" : "w-5 h-5 fold:w-4 fold:h-4"
                    )}
                  />
                ) : (
                  step.number
                )}
              </div>
              {variant !== "compact" && (
                <span
                  className={cn(
                    "mt-1.5 hig-caption-1 tablet:hig-caption-2 hidden fold:block",
                    isActive && "text-blue-500 font-semibold",
                    isCompleted && "text-green-600 font-medium",
                    !isActive && !isCompleted && "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>

            {!isLast && (
              <div
                className={cn(
                  "h-0.5 mx-1 fold:mx-2 rounded-full",
                  variant === "compact"
                    ? "w-4 sm:w-8"
                    : "w-6 fold:w-10 tablet:w-14",
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

/**
 * StepCard - Card-style step for vertical navigation (onboarding style)
 *
 * @param {object} props
 * @param {number} props.stepNumber - Step number
 * @param {string} props.label - Step title
 * @param {string} props.description - Step description
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {boolean} props.isActive - Whether this step is current
 * @param {boolean} props.isCompleted - Whether this step is done
 * @param {boolean} props.isClickable - Whether step can be clicked
 * @param {function} props.onClick - Click handler
 * @param {string} props.className - Additional classes
 */
export function StepCard({
  stepNumber,
  label,
  description,
  icon: Icon,
  isActive,
  isCompleted,
  isClickable = false,
  onClick,
  className,
}) {
  const Component = isClickable ? "button" : "div";

  return (
    <Component
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-colors",
        isActive && "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800",
        isCompleted && "bg-green-50 dark:bg-green-950",
        !isActive && !isCompleted && "bg-muted/50",
        isClickable && "cursor-pointer hover:bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          isActive && "bg-blue-500 text-white",
          isCompleted && "bg-green-500 text-white",
          !isActive && !isCompleted && "bg-gray-200 text-gray-500"
        )}
      >
        {isCompleted ? (
          <Check className="w-5 h-5" />
        ) : Icon ? (
          <Icon className="w-5 h-5" />
        ) : (
          stepNumber
        )}
      </div>
      <div className="flex-1 text-left">
        <p
          className={cn(
            "font-medium",
            isActive && "text-blue-700 dark:text-blue-300",
            isCompleted && "text-green-700 dark:text-green-300",
            !isActive && !isCompleted && "text-muted-foreground"
          )}
        >
          {label}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </Component>
  );
}

/**
 * VerticalStepNavigation - Vertical list of step cards
 *
 * @param {object} props
 * @param {Array} props.steps - Array of { number, label, description?, icon?, path? }
 * @param {number} props.currentStep - Current step number
 * @param {function} props.onStepClick - Called with step when clicked (makes steps clickable)
 * @param {string} props.className - Additional classes
 */
export function VerticalStepNavigation({
  steps,
  currentStep,
  onStepClick,
  className,
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step) => {
        const stepNum = step.number ?? step.step;
        return (
          <StepCard
            key={stepNum}
            stepNumber={stepNum}
            label={step.label}
            description={step.description}
            icon={step.icon}
            isActive={stepNum === currentStep}
            isCompleted={stepNum < currentStep}
            isClickable={!!onStepClick}
            onClick={() => onStepClick?.(step)}
          />
        );
      })}
    </div>
  );
}
