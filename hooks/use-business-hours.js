"use client";

import { useState, useEffect, useMemo } from "react";
import {
  calculateAverageBusinessHours,
  generateDurationOptions,
  formatDuration as formatDurationUtil,
  DEFAULT_BUSINESS_HOURS,
} from "@/lib/business-hours";

/**
 * Hook to fetch and calculate business hours from tenant settings
 * @returns {Object} Business hours data and utilities
 */
export function useBusinessHours() {
  const [availability, setAvailability] = useState([]);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BUSINESS_HOURS.breakDuration);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [availabilityRes, tenantRes] = await Promise.all([
          fetch("/api/availability"),
          fetch("/api/tenant"),
        ]);

        if (availabilityRes.ok) {
          const data = await availabilityRes.json();
          setAvailability(data);
        }

        if (tenantRes.ok) {
          const tenant = await tenantRes.json();
          if (tenant.breakDuration !== undefined) {
            setBreakDuration(tenant.breakDuration);
          }
        }
      } catch (error) {
        console.error("Error fetching business hours:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
