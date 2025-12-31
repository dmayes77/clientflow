"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * SettingsRow - A row with label, description, and control (typically a Switch)
 *
 * @param {object} props
 * @param {string} props.id - ID for label/control association
 * @param {string} props.label - Main label text
 * @param {string} props.description - Description text below label
 * @param {React.ReactNode} props.children - Control element (defaults to Switch)
 * @param {boolean} props.checked - For built-in Switch: checked state
 * @param {function} props.onCheckedChange - For built-in Switch: change handler
 * @param {boolean} props.disabled - Disable the control
 * @param {string} props.variant - "default" | "card" (adds background)
 * @param {string} props.className - Additional classes
 */
export function SettingsRow({
  id,
  label,
  description,
  children,
  checked,
  onCheckedChange,
  disabled = false,
  variant = "default",
  className,
}) {
  const hasBuiltInSwitch = checked !== undefined || onCheckedChange !== undefined;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        variant === "card" && "p-3 bg-muted/30 rounded-lg",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <Label htmlFor={id} className="font-medium mb-0 cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children || (hasBuiltInSwitch && (
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/**
 * SettingsSection - Group of settings rows with a heading
 *
 * @param {object} props
 * @param {string} props.title - Section title
 * @param {string} props.description - Section description
 * @param {React.ReactNode} props.children - SettingsRow components
 * @param {string} props.className - Additional classes
 */
export function SettingsSection({ title, description, children, className }) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && <h3 className="font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/**
 * SettingsCard - Card-styled settings section
 *
 * @param {object} props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {React.ReactNode} props.children - Content
 * @param {React.ReactNode} props.footer - Footer content (e.g., save button)
 * @param {string} props.className - Additional classes
 */
export function SettingsCard({ title, description, children, footer, className }) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {(title || description) && (
        <div className="p-4 border-b">
          {title && <h3 className="font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="p-4 space-y-4">{children}</div>
      {footer && (
        <div className="p-4 border-t bg-muted/30">{footer}</div>
      )}
    </div>
  );
}
