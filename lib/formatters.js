/**
 * Shared formatting utilities for currency, dates, and numbers
 * Use these instead of defining local formatters in components
 */

/**
 * Format cents to USD currency string
 * @param {number} cents - Amount in cents
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted currency string (e.g., "$10.00")
 */
export function formatCurrency(cents, options = {}) {
  if (cents === null || cents === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    ...options,
  }).format(cents / 100);
}

/**
 * Alias for formatCurrency - use whichever name fits your context
 */
export const formatPrice = formatCurrency;

/**
 * Format cents to USD currency without decimals (whole dollars)
 * Useful for pricing pages and plan displays
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted currency string (e.g., "$10")
 */
export function formatWholeDollars(cents) {
  return formatCurrency(cents, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format cents to compact currency (e.g., $1.2K, $5M)
 * Useful for dashboard stat displays
 * @param {number} cents - Amount in cents
 * @returns {string} Formatted compact currency string
 */
export function formatCompactCurrency(cents) {
  if (cents === null || cents === undefined) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1000000) {
    return `$${(dollars / 1000000).toFixed(1)}M`;
  }
  if (dollars >= 10000) {
    return `$${(dollars / 1000).toFixed(0)}K`;
  }
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`;
  }
  return `$${dollars.toFixed(2)}`;
}

/**
 * Format a date to a readable string
 * @param {string|Date} date - Date to format
 * @param {object} options - date-fns format options or Intl options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const {
    month = "short",
    day = "numeric",
    year = "numeric",
    ...rest
  } = options;

  return d.toLocaleDateString("en-US", { month, day, year, ...rest });
}

/**
 * Format a date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

/**
 * Format a percentage
 * @param {number} value - Decimal value (0.25 for 25%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 0) {
  if (value === null || value === undefined) return "0%";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format duration in minutes to readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "1h 30m" or "45min")
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return "0min";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
