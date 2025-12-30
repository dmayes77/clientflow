"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * EmptyState - Reusable component for displaying empty list states
 *
 * @param {object} props
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.iconColor - Color theme: "emerald", "blue", "violet", "amber", "rose", "gray" (default: "gray")
 * @param {string} props.title - Main heading text
 * @param {string} props.description - Supporting description text
 * @param {string} props.actionLabel - Button text (optional)
 * @param {function} props.onAction - Button click handler (optional)
 * @param {React.ReactNode} props.actionIcon - Icon for the action button (optional)
 * @param {React.ReactNode} props.children - Custom content instead of default action button
 * @param {string} props.className - Additional container classes
 */
export function EmptyState({
  icon: Icon,
  iconColor = "gray",
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  children,
  className,
}) {
  const colorClasses = {
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
    gray: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center mb-4",
            colorClasses[iconColor] || colorClasses.gray
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}
      {title && (
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      )}
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {children ? (
        children
      ) : actionLabel && onAction ? (
        <Button size="sm" onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
