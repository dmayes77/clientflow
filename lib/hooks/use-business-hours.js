"use client";

import { useMemo } from "react";
import {
  calculateAverageBusinessHours,
  generateDurationOptions,
  formatDuration as formatDurationUtil,
  DEFAULT_BUSINESS_HOURS,
} from "@/lib/business-hours";
import { useAvailability } from "./use-availability";
import { useTenant } from "./use-tenant";

/**
 * Hook to fetch and calculate business hours from tenant settings
 * @returns {Object} Business hours data and utilities
 */
export function useBusinessHours() {
  const { data: availability = [], isLoading: availabilityLoading } = useAvailability();
  const { data: tenant, isLoading: tenantLoading } = useTenant();

  const breakDuration = tenant?.breakDuration ?? DEFAULT_BUSINESS_HOURS.breakDuration;
  const loading = availabilityLoading || tenantLoading;

  // Calculate business hours per day
  const businessHoursPerDay = useMemo(() => {
    return calculateAverageBusinessHours(availability, breakDuration);
  }, [availability, breakDuration]);

  // Generate duration options for dropdowns
  const durationOptions = useMemo(() => {
    return generateDurationOptions(businessHoursPerDay);
  }, [businessHoursPerDay]);

  // Format duration helper
  const formatDuration = (minutes) => {
    return formatDurationUtil(minutes, businessHoursPerDay);
  };

  // Business day in minutes
  const businessDayMinutes = businessHoursPerDay * 60;

  return {
    loading,
    businessHoursPerDay,
    businessDayMinutes,
    breakDuration,
    durationOptions,
    formatDuration,
    availability,
  };
}
