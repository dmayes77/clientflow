/**
 * Business Hours Utility
 *
 * Calculates the number of working hours in a business day based on
 * the tenant's availability settings and break duration.
 */

/**
 * Parse a time string (HH:MM) into minutes since midnight
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate the working hours for a single day
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @param {number} breakDuration - Break duration in minutes
 * @returns {number} Working hours (not minutes)
 */
export function calculateDayHours(startTime, endTime, breakDuration = 0) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const workingMinutes = Math.max(0, endMinutes - startMinutes - breakDuration);
  return workingMinutes / 60;
}

/**
 * Calculate the average business hours per day from availability data
 * @param {Array} availability - Array of availability records
 * @param {number} breakDuration - Break duration in minutes
 * @returns {number} Average working hours per business day
 */
export function calculateAverageBusinessHours(availability, breakDuration = 60) {
  if (!availability || availability.length === 0) {
    return 8; // Default to 8 hours if no data
  }

  // Filter to active days only
  const activeDays = availability.filter(day => day.active);

  if (activeDays.length === 0) {
    return 8; // Default to 8 hours if no active days
  }

  // Calculate hours for each active day
  const totalHours = activeDays.reduce((sum, day) => {
    return sum + calculateDayHours(day.startTime, day.endTime, breakDuration);
  }, 0);

  // Return the average, rounded to nearest 0.5
  const average = totalHours / activeDays.length;
  return Math.round(average * 2) / 2; // Round to nearest 0.5
}

/**
 * Get the business day duration in minutes
 * @param {number} businessHoursPerDay - Hours in a business day
 * @returns {number} Minutes in a business day
 */
export function getBusinessDayMinutes(businessHoursPerDay = 8) {
  return businessHoursPerDay * 60;
}

/**
 * Generate duration options based on business hours
 * @param {number} businessHoursPerDay - Hours in a business day
 * @returns {Array} Array of duration options for select dropdown
 */
export function generateDurationOptions(businessHoursPerDay = 8) {
  const businessDayMinutes = getBusinessDayMinutes(businessHoursPerDay);

  // Hour options - only include hours less than 1 business day
  const hourOptions = [
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 180, label: "3 hours" },
    { value: 240, label: "4 hours" },
    { value: 300, label: "5 hours" },
    { value: 360, label: "6 hours" },
    { value: 420, label: "7 hours" },
  ].filter(opt => opt.value < businessDayMinutes);

  const options = [...hourOptions];

  // Add day options based on business hours
  for (let days = 1; days <= 5; days++) {
    const totalMinutes = businessDayMinutes * days;
    const totalHours = totalMinutes / 60;
    options.push({
      value: totalMinutes,
      label: `${days} day${days > 1 ? 's' : ''} (${totalHours} business hrs)`,
    });
  }

  return options;
}

/**
 * Format duration for display
 * @param {number} minutes - Duration in minutes
 * @param {number} businessHoursPerDay - Hours in a business day
 * @returns {string} Formatted duration string
 */
export function formatDuration(minutes, businessHoursPerDay = 8) {
  const businessDayMinutes = getBusinessDayMinutes(businessHoursPerDay);

  if (minutes >= businessDayMinutes) {
    const days = minutes / businessDayMinutes;
    if (Number.isInteger(days)) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    // Partial days - show as hours
    const hours = minutes / 60;
    return `${hours}h`;
  }

  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Default business hours configuration
 */
export const DEFAULT_BUSINESS_HOURS = {
  hoursPerDay: 8,
  breakDuration: 60, // 1 hour lunch
};
