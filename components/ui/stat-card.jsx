"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StatCard - Reusable statistics display card
 *
 * @param {object} props
 * @param {string} props.title - Stat label
 * @param {string|number} props.value - Main stat value
 * @param {string} props.subtitle - Secondary text below value
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {number} props.trend - Percentage change (shows up/down arrow)
 * @param {boolean} props.loading - Show loading skeleton
 * @param {string} props.variant - "default" | "accent" | "compact"
 * @param {string} props.accentColor - Color for accent variant: "green" | "blue" | "purple" | "amber" | "teal" | "red"
 * @param {string} props.className - Additional classes
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  loading = false,
  variant = "default",
  accentColor = "blue",
  className,
}) {
  const accentColors = {
    green: {
      border: "border-l-green-500",
      text: "text-green-600",
      bg: "bg-green-100",
      darkBg: "dark:bg-green-950",
      iconText: "text-green-600 dark:text-green-400",
    },
    blue: {
      border: "border-l-blue-500",
      text: "text-blue-600",
      bg: "bg-blue-100",
      darkBg: "dark:bg-blue-950",
      iconText: "text-blue-600 dark:text-blue-400",
    },
    purple: {
      border: "border-l-purple-500",
      text: "text-purple-600",
      bg: "bg-purple-100",
      darkBg: "dark:bg-purple-950",
      iconText: "text-purple-600 dark:text-purple-400",
    },
    amber: {
      border: "border-l-amber-500",
      text: "text-amber-600",
      bg: "bg-amber-100",
      darkBg: "dark:bg-amber-950",
      iconText: "text-amber-600 dark:text-amber-400",
    },
    teal: {
      border: "border-l-teal-500",
      text: "text-teal-600",
      bg: "bg-teal-100",
      darkBg: "dark:bg-teal-950",
      iconText: "text-teal-600 dark:text-teal-400",
    },
    red: {
      border: "border-l-red-500",
      text: "text-red-600",
      bg: "bg-red-100",
      darkBg: "dark:bg-red-950",
      iconText: "text-red-600 dark:text-red-400",
    },
  };

  const colors = accentColors[accentColor] || accentColors.blue;

  // Accent variant - colored left border with icon circle
  if (variant === "accent") {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-4 border-l-4",
          colors.border,
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium", colors.text)}>{title}</p>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <>
                <p className="font-bold mt-1">{value}</p>
                {trend !== undefined ? (
                  <div
                    className={cn(
                      "flex items-center gap-1 hig-caption-2 mt-1",
                      trend >= 0 ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {trend >= 0 ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    <span>
                      {trend >= 0 ? "+" : ""}
                      {typeof trend === "number" ? trend.toFixed(1) : trend}%
                    </span>
                  </div>
                ) : subtitle ? (
                  <p className="text-muted-foreground mt-1">{subtitle}</p>
                ) : null}
              </>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "size-10 rounded-full flex items-center justify-center",
                colors.bg,
                colors.darkBg
              )}
            >
              <Icon className={cn("size-5", colors.iconText)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Compact variant - minimal padding, no card header
  if (variant === "compact") {
    return (
      <Card className={className}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="hig-caption-2 font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </span>
            {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          {loading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <>
              <div className="font-bold">{value}</div>
              {subtitle && (
                <span className="hig-caption-2 text-muted-foreground">
                  {subtitle}
                </span>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant - card with header
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="font-medium text-muted-foreground hig-caption1">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-muted-foreground sm:h-4 sm:w-4" />
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        {loading ? (
          <Skeleton className="h-6 w-16 sm:h-8 sm:w-24" />
        ) : (
          <>
            <div className="font-bold">{value}</div>
            {(subtitle || trend !== undefined) && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 hig-caption-2">
                {trend !== undefined && (
                  <>
                    {trend > 0 ? (
                      <TrendingUp className="h-2.5 w-2.5 text-green-500 sm:h-3 sm:w-3" />
                    ) : trend < 0 ? (
                      <TrendingDown className="h-2.5 w-2.5 text-red-500 sm:h-3 sm:w-3" />
                    ) : null}
                    <span
                      className={
                        trend > 0
                          ? "text-green-600"
                          : trend < 0
                          ? "text-red-600"
                          : ""
                      }
                    >
                      {trend > 0 ? "+" : ""}
                      {trend}%
                    </span>
                  </>
                )}
                {subtitle}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
