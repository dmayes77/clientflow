"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * App Checkbox Component
 * Uses enterprise theme CSS variables for responsive sizing.
 */
const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer size-4 shrink-0 rounded-[var(--et-radius-sm)] border border-[var(--et-input)] ring-offset-[var(--et-card)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--et-ring)]/50 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[var(--et-primary)] data-[state=checked]:border-[var(--et-primary)] data-[state=checked]:text-[var(--et-primary-foreground)]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="size-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
