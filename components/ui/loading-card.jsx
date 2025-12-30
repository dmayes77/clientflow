"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

/**
 * LoadingCard - Reusable loading state component
 *
 * @param {object} props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Icon size: "sm", "md", "lg" (default: "md")
 * @param {string} props.className - Additional container classes
 * @param {boolean} props.card - Whether to wrap in a Card (default: true)
 */
export function LoadingCard({
  message,
  size = "md",
  className,
  card = true,
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className
      )}
    >
      <Loader2
        className={cn(
          "animate-spin text-muted-foreground",
          sizeClasses[size] || sizeClasses.md
        )}
      />
      {message && (
        <p className="text-sm text-muted-foreground mt-3">{message}</p>
      )}
    </div>
  );

  if (!card) {
    return content;
  }

  return (
    <Card>
      <CardContent className="p-0">{content}</CardContent>
    </Card>
  );
}

/**
 * LoadingSpinner - Simple inline loading spinner
 *
 * @param {object} props
 * @param {string} props.size - Icon size: "xs", "sm", "md" (default: "sm")
 * @param {string} props.className - Additional classes
 */
export function LoadingSpinner({ size = "sm", className }) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size] || sizeClasses.sm,
        className
      )}
    />
  );
}
