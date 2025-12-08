"use client";

import { useBusinessHours } from "@/hooks/use-business-hours";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/(auth)/components/ui/select";

/**
 * Duration Select Component
 *
 * A dropdown for selecting duration that automatically calculates
 * business days based on the tenant's availability settings.
 */
export function DurationSelect({ value, onValueChange, id, placeholder = "Select duration", ...props }) {
  const { durationOptions, loading } = useBusinessHours();

  return (
    <Select
      value={String(value)}
      onValueChange={(val) => onValueChange(parseInt(val))}
      {...props}
    >
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {durationOptions.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Format duration for display using business hours
 * This is a component wrapper for use in JSX when you just need to display duration
 */
export function DurationDisplay({ minutes }) {
  const { formatDuration } = useBusinessHours();
  return <>{formatDuration(minutes)}</>;
}
