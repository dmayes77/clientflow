/**
 * Schedule utility functions for break-aware time calculations
 */

/**
 * Calculate the adjusted end time for an appointment considering break periods
 *
 * Example:
 * - Start: 9:00 AM
 * - Duration: 4 hours (240 min)
 * - Break: 12:00 PM - 1:00 PM
 * - Result: End time = 2:00 PM (not 1:00 PM)
 *
 * @param {Date} startTime - Appointment start time
 * @param {number} durationMinutes - Appointment duration in minutes
 * @param {string|null} breakStartTime - Break start time (HH:mm format, e.g., "12:00")
 * @param {string|null} breakEndTime - Break end time (HH:mm format, e.g., "13:00")
 * @returns {Date} - Adjusted end time including break extension
 */
export function calculateAdjustedEndTime(
  startTime,
  durationMinutes,
  breakStartTime = null,
  breakEndTime = null
) {
  // If no break configured, return simple end time
  if (!breakStartTime || !breakEndTime) {
    return new Date(startTime.getTime() + durationMinutes * 60000);
  }

  // Parse break times
  const [breakStartHour, breakStartMin] = breakStartTime.split(':').map(Number);
  const [breakEndHour, breakEndMin] = breakEndTime.split(':').map(Number);

  // Create break period dates on the same day as appointment
  const breakStart = new Date(startTime);
  breakStart.setHours(breakStartHour, breakStartMin, 0, 0);

  const breakEnd = new Date(startTime);
  breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);

  const breakDurationMs = breakEnd.getTime() - breakStart.getTime();

  // Calculate naive end time (without considering break)
  const naiveEndTime = new Date(startTime.getTime() + durationMinutes * 60000);

  // Check if appointment spans the break period
  // Appointment spans break if:
  // 1. It starts before break ends
  // 2. It would end after break starts (using naive end time)
  const startsBeforeBreakEnds = startTime < breakEnd;
  const endsAfterBreakStarts = naiveEndTime > breakStart;

  if (startsBeforeBreakEnds && endsAfterBreakStarts) {
    // Appointment spans break period, add break duration to end time
    return new Date(naiveEndTime.getTime() + breakDurationMs);
  }

  // Appointment doesn't span break, return naive end time
  return naiveEndTime;
}

/**
 * Check if a time slot overlaps with the break period
 *
 * @param {Date} slotStart - Slot start time
 * @param {Date} slotEnd - Slot end time
 * @param {string|null} breakStartTime - Break start time (HH:mm format)
 * @param {string|null} breakEndTime - Break end time (HH:mm format)
 * @returns {boolean} - True if slot overlaps with break
 */
export function slotOverlapsBreak(slotStart, slotEnd, breakStartTime, breakEndTime) {
  if (!breakStartTime || !breakEndTime) {
    return false;
  }

  const [breakStartHour, breakStartMin] = breakStartTime.split(':').map(Number);
  const [breakEndHour, breakEndMin] = breakEndTime.split(':').map(Number);

  const breakStart = new Date(slotStart);
  breakStart.setHours(breakStartHour, breakStartMin, 0, 0);

  const breakEnd = new Date(slotStart);
  breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);

  // Check for overlap: slot starts before break ends AND slot ends after break starts
  return slotStart < breakEnd && slotEnd > breakStart;
}

/**
 * Calculate break duration in minutes
 *
 * @param {string|null} breakStartTime - Break start time (HH:mm format)
 * @param {string|null} breakEndTime - Break end time (HH:mm format)
 * @returns {number} - Break duration in minutes
 */
export function getBreakDurationMinutes(breakStartTime, breakEndTime) {
  if (!breakStartTime || !breakEndTime) {
    return 0;
  }

  const [startHour, startMin] = breakStartTime.split(':').map(Number);
  const [endHour, endMin] = breakEndTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes - startMinutes;
}
