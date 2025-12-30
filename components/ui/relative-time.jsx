"use client";

import { useMemo } from "react";
import { formatDistanceToNow, format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Parse a date value to a Date object
 * @param {Date|string|number} date - Date to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseDate(date) {
  if (!date) return null;
  if (date instanceof Date) return isValid(date) ? date : null;
  if (typeof date === "string") {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }
  if (typeof date === "number") {
    const parsed = new Date(date);
    return isValid(parsed) ? parsed : null;
  }
  return null;
}

/**
 * RelativeTime - Display time relative to now (e.g., "2 hours ago")
 *
 * @param {object} props
 * @param {Date|string|number} props.date - Date to display
 * @param {boolean} props.addSuffix - Add "ago" or "in" (default: true)
 * @param {boolean} props.includeSeconds - Include seconds in output
 * @param {string} props.fallback - Fallback text for invalid dates
 * @param {string} props.className - Additional classes
 * @param {string} props.titleFormat - Format for title tooltip (default: "PPpp")
 */
export function RelativeTime({
  date,
  addSuffix = true,
  includeSeconds = false,
  fallback = "",
  className,
  titleFormat = "PPpp",
}) {
  const parsedDate = useMemo(() => parseDate(date), [date]);

  const relativeText = useMemo(() => {
    if (!parsedDate) return fallback;
    return formatDistanceToNow(parsedDate, { addSuffix, includeSeconds });
  }, [parsedDate, addSuffix, includeSeconds, fallback]);

  const titleText = useMemo(() => {
    if (!parsedDate) return "";
    return format(parsedDate, titleFormat);
  }, [parsedDate, titleFormat]);

  if (!parsedDate) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  return (
    <time
      dateTime={parsedDate.toISOString()}
      title={titleText}
      className={cn("tabular-nums", className)}
    >
      {relativeText}
    </time>
  );
}

/**
 * FormattedDate - Display formatted date
 *
 * @param {object} props
 * @param {Date|string|number} props.date - Date to display
 * @param {string} props.format - date-fns format string (default: "MMM d, yyyy")
 * @param {string} props.fallback - Fallback text for invalid dates
 * @param {string} props.className - Additional classes
 */
export function FormattedDate({
  date,
  format: formatStr = "MMM d, yyyy",
  fallback = "",
  className,
}) {
  const parsedDate = useMemo(() => parseDate(date), [date]);

  const formattedText = useMemo(() => {
    if (!parsedDate) return fallback;
    return format(parsedDate, formatStr);
  }, [parsedDate, formatStr, fallback]);

  if (!parsedDate) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  return (
    <time dateTime={parsedDate.toISOString()} className={className}>
      {formattedText}
    </time>
  );
}

/**
 * FormattedDateTime - Display formatted date and time
 *
 * @param {object} props
 * @param {Date|string|number} props.date - Date to display
 * @param {string} props.dateFormat - Format for date part (default: "MMM d, yyyy")
 * @param {string} props.timeFormat - Format for time part (default: "h:mm a")
 * @param {string} props.separator - Separator between date and time (default: " at ")
 * @param {string} props.fallback - Fallback text for invalid dates
 * @param {string} props.className - Additional classes
 */
export function FormattedDateTime({
  date,
  dateFormat = "MMM d, yyyy",
  timeFormat = "h:mm a",
  separator = " at ",
  fallback = "",
  className,
}) {
  const parsedDate = useMemo(() => parseDate(date), [date]);

  const formattedText = useMemo(() => {
    if (!parsedDate) return fallback;
    const datePart = format(parsedDate, dateFormat);
    const timePart = format(parsedDate, timeFormat);
    return `${datePart}${separator}${timePart}`;
  }, [parsedDate, dateFormat, timeFormat, separator, fallback]);

  if (!parsedDate) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  return (
    <time dateTime={parsedDate.toISOString()} className={className}>
      {formattedText}
    </time>
  );
}

/**
 * DateWithRelative - Show formatted date with relative time on hover
 *
 * @param {object} props
 * @param {Date|string|number} props.date - Date to display
 * @param {string} props.format - Format for display (default: "MMM d, yyyy")
 * @param {string} props.className - Additional classes
 */
export function DateWithRelative({
  date,
  format: formatStr = "MMM d, yyyy",
  className,
}) {
  const parsedDate = useMemo(() => parseDate(date), [date]);

  const formattedText = useMemo(() => {
    if (!parsedDate) return "";
    return format(parsedDate, formatStr);
  }, [parsedDate, formatStr]);

  const relativeText = useMemo(() => {
    if (!parsedDate) return "";
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  }, [parsedDate]);

  if (!parsedDate) return null;

  return (
    <time
      dateTime={parsedDate.toISOString()}
      title={relativeText}
      className={cn("cursor-help", className)}
    >
      {formattedText}
    </time>
  );
}
