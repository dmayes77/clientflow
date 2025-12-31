"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Generate time options for a select
 * @param {number} intervalMinutes - Interval between options (default: 30)
 * @param {string} startTime - Start time in HH:MM format (default: "00:00")
 * @param {string} endTime - End time in HH:MM format (default: "23:30")
 * @returns {Array} Array of { value, label } objects
 */
export function generateTimeOptions(intervalMinutes = 30, startTime = "00:00", endTime = "23:30") {
  const options = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    const h = hour.toString().padStart(2, "0");
    const m = min.toString().padStart(2, "0");
    const time = `${h}:${m}`;
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    const label = `${displayHour}:${m.padStart(2, "0")} ${ampm}`;
    options.push({ value: time, label });
  }
  return options;
}

/**
 * Format time from 24h to 12h display
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time like "3:30 PM"
 */
export function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Default time options (every 30 minutes)
 */
export const TIME_OPTIONS = generateTimeOptions(30);

/**
 * TimeSelect - Time picker using shadcn Select
 *
 * @param {object} props
 * @param {string} props.value - Selected time in HH:MM format
 * @param {function} props.onChange - Called with new time value
 * @param {string} props.placeholder - Placeholder text (default: "Select time")
 * @param {Array} props.options - Custom time options (default: every 30 min)
 * @param {number} props.interval - Interval in minutes for auto-generated options
 * @param {string} props.startTime - Start time for auto-generated options
 * @param {string} props.endTime - End time for auto-generated options
 * @param {boolean} props.disabled - Disable the select
 * @param {string} props.className - Additional classes
 */
export function TimeSelect({
  value,
  onChange,
  placeholder = "Select time",
  options,
  interval,
  startTime,
  endTime,
  disabled = false,
  className,
}) {
  const timeOptions = options ||
    (interval || startTime || endTime
      ? generateTimeOptions(interval, startTime, endTime)
      : TIME_OPTIONS);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {timeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * TimeRangeSelect - Two time selects for start/end time
 *
 * @param {object} props
 * @param {string} props.startValue - Start time in HH:MM format
 * @param {string} props.endValue - End time in HH:MM format
 * @param {function} props.onStartChange - Called with new start time
 * @param {function} props.onEndChange - Called with new end time
 * @param {string} props.separator - Text between selects (default: "to")
 * @param {boolean} props.disabled - Disable both selects
 * @param {string} props.className - Additional classes for wrapper
 */
export function TimeRangeSelect({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  separator = "to",
  disabled = false,
  className,
  ...props
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TimeSelect
        value={startValue}
        onChange={onStartChange}
        placeholder="Start"
        disabled={disabled}
        {...props}
      />
      <span className="text-muted-foreground text-sm">{separator}</span>
      <TimeSelect
        value={endValue}
        onChange={onEndChange}
        placeholder="End"
        disabled={disabled}
        {...props}
      />
    </div>
  );
}
