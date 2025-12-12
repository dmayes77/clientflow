"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * App Input Component
 * Uses responsive theme variables for sizing.
 */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const isDateType = ["date", "time", "datetime-local"].includes(type);

  return (
    <input
      type={type}
      className={cn(
        "flex h-md w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Date/time inputs: position calendar/clock icon on the right
        isDateType && "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer relative",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
