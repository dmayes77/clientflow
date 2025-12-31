"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * PageHeader - Consistent page header with title, description, and actions
 *
 * @param {object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {React.ReactNode} props.actions - Action buttons
 * @param {React.ReactNode} props.children - Alternative to actions
 * @param {boolean} props.showBack - Show back button
 * @param {string} props.backHref - Custom back href (default: browser back)
 * @param {string} props.backLabel - Back button label
 * @param {React.ReactNode} props.badge - Badge next to title
 * @param {React.ReactNode} props.icon - Icon before title
 * @param {string} props.className - Additional classes
 */
export function PageHeader({
  title,
  description,
  actions,
  children,
  showBack = false,
  backHref,
  backLabel,
  badge,
  icon: Icon,
  className,
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {showBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {backLabel || "Back"}
        </Button>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6 text-muted-foreground shrink-0" />}
            <h1 className="font-bold truncate">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {(actions || children) && (
          <div className="flex items-center gap-2 shrink-0">
            {actions || children}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PageSection - Section within a page with optional header
 *
 * @param {object} props
 * @param {string} props.title - Section title
 * @param {string} props.description - Section description
 * @param {React.ReactNode} props.actions - Action buttons
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.className - Additional classes
 */
export function PageSection({
  title,
  description,
  actions,
  children,
  className,
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * PageActions - Consistent action button group
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Action buttons
 * @param {string} props.className - Additional classes
 */
export function PageActions({ children, className }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
}
