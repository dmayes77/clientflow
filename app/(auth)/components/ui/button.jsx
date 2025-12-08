"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * App Button Component
 * Uses enterprise theme CSS variables for responsive sizing.
 * Compact on desktop, touch-friendly on mobile.
 */
const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-[var(--et-space-1)] whitespace-nowrap rounded-[var(--et-radius-md)] text-[length:var(--et-text-sm)] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[var(--et-icon-sm)] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--et-ring)]/50 focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        default: "bg-[var(--et-primary)] text-[var(--et-primary-foreground)] hover:opacity-90 shadow-sm",
        destructive: "bg-[var(--et-destructive)] text-[var(--et-destructive-foreground)] hover:opacity-90 shadow-sm",
        outline: "border border-[var(--et-border)] bg-[var(--et-card)] text-[var(--et-foreground)] hover:bg-[var(--et-accent)] hover:text-[var(--et-accent-foreground)] shadow-sm",
        secondary: "bg-[var(--et-secondary)] text-[var(--et-secondary-foreground)] hover:opacity-90",
        ghost: "text-[var(--et-foreground)] hover:bg-[var(--et-accent)] hover:text-[var(--et-accent-foreground)]",
        link: "text-[var(--et-primary)] underline-offset-4 hover:underline",
        success: "bg-[var(--et-success)] text-[var(--et-success-foreground)] hover:opacity-90 shadow-sm",
        warning: "bg-[var(--et-warning)] text-[var(--et-warning-foreground)] hover:opacity-90 shadow-sm",
        info: "bg-[var(--et-info)] text-[var(--et-info-foreground)] hover:opacity-90 shadow-sm",
      },
      size: {
        default: "h-[var(--et-height-md)] px-[var(--et-space-4)] py-[var(--et-space-2)]",
        sm: "h-[var(--et-height-sm)] rounded-[var(--et-radius-md)] gap-[var(--et-space-1)] px-[var(--et-space-3)] text-[length:var(--et-text-xs)]",
        xs: "h-[var(--et-height-xs)] rounded-[var(--et-radius-sm)] px-[var(--et-space-2)] gap-[var(--et-space-1)] text-[length:var(--et-text-2xs)]",
        lg: "h-[var(--et-height-lg)] rounded-[var(--et-radius-md)] px-[var(--et-space-6)]",
        icon: "h-[var(--et-height-md)] w-[var(--et-height-md)]",
        "icon-sm": "h-[var(--et-height-sm)] w-[var(--et-height-sm)]",
        "icon-xs": "h-[var(--et-height-xs)] w-[var(--et-height-xs)]",
        "icon-lg": "h-[var(--et-height-lg)] w-[var(--et-height-lg)]",
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
