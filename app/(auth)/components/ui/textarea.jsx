"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * App Textarea Component
 * Uses enterprise theme CSS variables for responsive sizing.
 */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-[var(--et-radius-md)] border border-[var(--et-input)] bg-[var(--et-input-bg)] px-[var(--et-space-3)] py-[var(--et-space-2)] text-[length:var(--et-text-base)] shadow-[var(--et-shadow-sm)] transition-colors",
        "placeholder:text-[var(--et-muted-foreground)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--et-ring)]/50 focus-visible:border-[var(--et-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
