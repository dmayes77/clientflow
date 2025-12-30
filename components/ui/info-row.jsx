"use client";

import { cn } from "@/lib/utils";

/**
 * InfoRow - Display a label-value pair
 *
 * @param {object} props
 * @param {string} props.label - Label text
 * @param {React.ReactNode} props.value - Value to display
 * @param {React.ReactNode} props.children - Alternative to value prop
 * @param {React.ComponentType} props.icon - Optional icon component
 * @param {string} props.layout - "horizontal" | "vertical" | "stacked"
 * @param {boolean} props.truncate - Truncate long values
 * @param {string} props.className - Additional classes
 * @param {string} props.labelClassName - Additional classes for label
 * @param {string} props.valueClassName - Additional classes for value
 */
export function InfoRow({
  label,
  value,
  children,
  icon: Icon,
  layout = "horizontal",
  truncate = false,
  className,
  labelClassName,
  valueClassName,
}) {
  const displayValue = children ?? value;

  if (displayValue === null || displayValue === undefined || displayValue === "") {
    return null;
  }

  if (layout === "vertical" || layout === "stacked") {
    return (
      <div className={cn("space-y-1", className)}>
        <div className={cn("text-sm text-muted-foreground", labelClassName)}>
          {Icon && <Icon className="h-3.5 w-3.5 inline mr-1.5" />}
          {label}
        </div>
        <div className={cn("font-medium", truncate && "truncate", valueClassName)}>
          {displayValue}
        </div>
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className={cn("text-sm text-muted-foreground shrink-0", labelClassName)}>
        {Icon && <Icon className="h-3.5 w-3.5 inline mr-1.5" />}
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium text-right",
          truncate && "truncate min-w-0",
          valueClassName
        )}
      >
        {displayValue}
      </span>
    </div>
  );
}

/**
 * InfoList - Display multiple info rows
 *
 * @param {object} props
 * @param {Array} props.items - Array of { label, value, icon? } objects
 * @param {string} props.layout - "horizontal" | "vertical" | "grid"
 * @param {number} props.columns - Number of columns for grid layout (default: 2)
 * @param {boolean} props.dividers - Show dividers between items
 * @param {string} props.className - Additional classes
 */
export function InfoList({
  items,
  layout = "horizontal",
  columns = 2,
  dividers = false,
  className,
}) {
  const filteredItems = items?.filter(
    (item) => item.value !== null && item.value !== undefined && item.value !== ""
  );

  if (!filteredItems || filteredItems.length === 0) return null;

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  if (layout === "grid") {
    return (
      <div className={cn("grid gap-4", gridCols[columns] || gridCols[2], className)}>
        {filteredItems.map((item, index) => (
          <InfoRow
            key={item.label || index}
            label={item.label}
            value={item.value}
            icon={item.icon}
            layout="vertical"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2",
        dividers && "divide-y divide-border space-y-0 [&>*]:py-2 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0",
        className
      )}
    >
      {filteredItems.map((item, index) => (
        <InfoRow
          key={item.label || index}
          label={item.label}
          value={item.value}
          icon={item.icon}
          layout={layout}
        />
      ))}
    </div>
  );
}

/**
 * DetailCard - Card with title and info rows
 *
 * @param {object} props
 * @param {string} props.title - Card title
 * @param {Array} props.items - Array of { label, value } objects
 * @param {React.ReactNode} props.children - Alternative to items
 * @param {React.ReactNode} props.action - Action button in header
 * @param {string} props.className - Additional classes
 */
export function DetailCard({
  title,
  items,
  children,
  action,
  className,
}) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h3 className="font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      <div className="p-4">
        {children || (items && <InfoList items={items} dividers />)}
      </div>
    </div>
  );
}
