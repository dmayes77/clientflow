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
        "flex min-h-20 w-full rounded-md border border-input bg-background shadow-sm transition-colors",
        "px-3 py-3 fold:py-2.5 tablet:py-2 desktop:py-1.5",
        "tablet:text-sm desktop:text-xs",
        /* Base 15px on mobile */
        "text-[15px] leading-5",
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
