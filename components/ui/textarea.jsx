"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * App Textarea Component
 * Uses responsive theme variables for sizing.
 */
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm transition-colors",
        "tablet:text-sm desktop:text-xs",
        /* HIG callout (mobile default) - 16px minimum prevents iOS zoom */
        "text-[16px] tracking-[-0.32px] leading-[21px]",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
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
