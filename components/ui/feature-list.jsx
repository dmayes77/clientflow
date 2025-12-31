"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FeatureList - Display a list of features with check/x icons
 *
 * @param {object} props
 * @param {Array} props.features - Array of strings or { text, included } objects
 * @param {string} props.variant - "default" | "compact" | "grid"
 * @param {number} props.columns - Number of columns for grid variant (default: 2)
 * @param {string} props.checkColor - Color class for check icons (default: "text-green-500")
 * @param {boolean} props.showExcluded - Show excluded features with X icon
 * @param {string} props.className - Additional classes
 */
export function FeatureList({
  features,
  variant = "default",
  columns = 2,
  checkColor = "text-green-500",
  showExcluded = false,
  className,
}) {
  if (!features || features.length === 0) return null;

  const normalizedFeatures = features.map((f) =>
    typeof f === "string" ? { text: f, included: true } : f
  );

  const displayFeatures = showExcluded
    ? normalizedFeatures
    : normalizedFeatures.filter((f) => f.included);

  const gridCols = {
    1: "grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  if (variant === "grid") {
    return (
      <div className={cn("grid gap-3", gridCols[columns] || gridCols[2], className)}>
        {displayFeatures.map((feature, idx) => (
          <FeatureItem
            key={idx}
            text={feature.text}
            included={feature.included}
            checkColor={checkColor}
            variant={variant}
          />
        ))}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-2", variant === "compact" && "space-y-1", className)}>
      {displayFeatures.map((feature, idx) => (
        <FeatureItem
          key={idx}
          text={feature.text}
          included={feature.included}
          checkColor={checkColor}
          variant={variant}
          as="li"
        />
      ))}
    </ul>
  );
}

/**
 * FeatureItem - Single feature item with icon
 */
function FeatureItem({
  text,
  included = true,
  checkColor = "text-green-500",
  variant = "default",
  as: Component = "div",
}) {
  const iconSize = variant === "compact" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = variant === "compact" ? "text-sm" : "";

  return (
    <Component className="flex items-center gap-2">
      {included ? (
        <Check className={cn(iconSize, checkColor, "shrink-0")} />
      ) : (
        <X className={cn(iconSize, "text-muted-foreground shrink-0")} />
      )}
      <span className={cn(textSize, !included && "text-muted-foreground line-through")}>
        {text}
      </span>
    </Component>
  );
}

/**
 * IncludesList - Display a numbered or bulleted list of includes
 * Used for service/package includes
 *
 * @param {object} props
 * @param {Array} props.items - Array of string items
 * @param {boolean} props.numbered - Show numbers instead of checks
 * @param {string} props.emptyMessage - Message when no items
 * @param {string} props.className - Additional classes
 */
export function IncludesList({
  items,
  numbered = false,
  emptyMessage = "No items",
  className,
}) {
  if (!items || items.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground italic", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm">
          {numbered ? (
            <span className="text-muted-foreground font-medium shrink-0 w-5">
              {idx + 1}.
            </span>
          ) : (
            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
