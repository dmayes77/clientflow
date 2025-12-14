"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/**
 * App Label Component
 * Uses responsive theme variables for sizing.
 */
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "font-medium text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
      "tablet:text-xs desktop:text-xs",
      /* HIG footnote (mobile default) */
      "text-[13px] tracking-[-0.078px] leading-[18px]",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
