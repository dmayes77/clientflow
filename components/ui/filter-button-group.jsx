"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * FilterButtonGroup - Compact inline filter buttons (segmented control style)
 *
 * @param {object} props
 * @param {Array} props.options - Array of { value, label, count?, icon? }
 * @param {string} props.value - Currently selected value
 * @param {function} props.onChange - Called with new value when selection changes
 * @param {string} props.size - Button size: "sm" | "default" (default: "sm")
 * @param {boolean} props.showCounts - Show counts in badges (default: true if counts provided)
 * @param {string} props.className - Additional classes for wrapper
 */
export function FilterButtonGroup({
  options,
  value,
  onChange,
  size = "sm",
  showCounts = true,
  className,
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 bg-muted rounded-lg",
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;
        const hasCount = showCounts && option.count !== undefined;

        return (
          <Button
            key={option.value}
            variant={isActive ? "secondary" : "ghost"}
            size={size}
            onClick={() => onChange(option.value)}
            className={cn(
              "transition-all",
              isActive && "shadow-sm bg-background"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
            {option.label}
            {hasCount && (
              <span
                className={cn(
                  "ml-1.5 text-xs rounded-full px-1.5 min-w-[1.25rem] text-center",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted-foreground/10 text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * StatusFilterButtons - Common pattern for all/active/inactive filtering
 */
export function StatusFilterButtons({
  value,
  onChange,
  counts = {},
  allLabel = "All",
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  className,
}) {
  const options = [
    { value: "all", label: allLabel, count: counts.all },
    { value: "active", label: activeLabel, count: counts.active },
    { value: "inactive", label: inactiveLabel, count: counts.inactive },
  ];

  return (
    <FilterButtonGroup
      options={options}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}
