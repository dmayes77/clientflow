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
      "h-8 w-14 fold:h-7 fold:w-12 tablet:h-6 tablet:w-11 desktop:h-5 desktop:w-9",
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
        "size-7 fold:size-6 tablet:size-5 desktop:size-4",
        "data-[state=checked]:translate-x-6 fold:data-[state=checked]:translate-x-5 tablet:data-[state=checked]:translate-x-5 desktop:data-[state=checked]:translate-x-4",
        "data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
