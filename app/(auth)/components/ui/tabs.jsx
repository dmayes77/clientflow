"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * App Tabs Components
 * Uses enterprise theme CSS variables for responsive sizing.
 */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-[var(--et-height-md)] items-center justify-center rounded-[var(--et-radius-md)] bg-[var(--et-muted)] p-[var(--et-space-1)] text-[var(--et-muted-foreground)]",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--et-radius-sm)] px-[var(--et-space-3)] py-[var(--et-space-1)] text-[length:var(--et-text-sm)] font-[var(--et-font-medium)] ring-offset-[var(--et-card)] transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--et-ring)]/50 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-[var(--et-card)] data-[state=active]:text-[var(--et-foreground)] data-[state=active]:shadow-[var(--et-shadow-sm)]",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-[var(--et-space-2)] ring-offset-[var(--et-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--et-ring)]/50 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
