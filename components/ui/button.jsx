"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * App Button Component
 * Uses responsive theme variables for sizing.
 * Compact on desktop, touch-friendly on mobile.
 */
const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm",
        outline: "border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground shadow-sm",
        secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:opacity-90 shadow-sm",
        warning: "bg-warning text-warning-foreground hover:opacity-90 shadow-sm",
        info: "bg-info text-info-foreground hover:opacity-90 shadow-sm",
      },
      size: {
        // Default: touch-friendly mobile → compact desktop
        default:
          "px-6 py-3 fold:px-5 fold:py-2.5 tablet:px-4 tablet:py-2 desktop:px-3 desktop:py-1.5 text-[13px] fold:text-sm tablet:text-sm desktop:text-xs",
        // Small
        sm: "px-4 py-2 fold:px-3 fold:py-1.5 tablet:px-3 tablet:py-1.5 desktop:px-2 desktop:py-1 text-[12px] fold:text-xs tablet:text-xs desktop:text-xs gap-1",
        // Extra small
        xs: "px-3 py-1.5 desktop:px-2 desktop:py-1 text-xs desktop:text-2xs gap-1 rounded-sm",
        // Large
        lg: "px-8 py-4 fold:px-7 fold:py-3.5 tablet:px-6 tablet:py-3 desktop:px-5 desktop:py-2.5 text-lg fold:text-base tablet:text-base desktop:text-sm",
        // Icon buttons - square, responsive
        icon: "size-11 fold:size-10 tablet:size-9 desktop:size-8",
        "icon-sm": "size-9 fold:size-8 tablet:size-8 desktop:size-7",
        "icon-xs": "size-7 fold:size-7 tablet:size-6 desktop:size-6 rounded-sm",
        "icon-lg": "size-12 fold:size-11 tablet:size-10 desktop:size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
