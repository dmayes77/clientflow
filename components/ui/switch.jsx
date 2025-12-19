"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

/**
 * App Switch Component
 * Uses responsive theme variables for sizing.
 */
const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
      "h-6 w-11 tablet:h-5 tablet:w-9",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block rounded-full bg-card shadow-lg ring-0 transition-transform",
        "size-5 tablet:size-4",
        "data-[state=checked]:translate-x-5 tablet:data-[state=checked]:translate-x-4",
        "data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
