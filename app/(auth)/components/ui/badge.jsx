"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * App Badge Component
 * Uses enterprise theme CSS variables for responsive sizing.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-[var(--et-space-2)] py-px text-[length:var(--et-text-2xs)] font-[var(--et-font-medium)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--et-ring)]/50",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--et-primary)] text-[var(--et-primary-foreground)]",
        secondary: "border-transparent bg-[var(--et-secondary)] text-[var(--et-secondary-foreground)]",
        destructive: "border-transparent bg-[var(--et-destructive)] text-[var(--et-destructive-foreground)]",
        outline: "border-[var(--et-border)] text-[var(--et-foreground)]",
        success: "border-transparent bg-[var(--et-success-muted)] text-[var(--et-success)]",
        warning: "border-transparent bg-[var(--et-warning-muted)] text-[var(--et-warning)]",
        info: "border-transparent bg-[var(--et-info-muted)] text-[var(--et-info)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  );
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
