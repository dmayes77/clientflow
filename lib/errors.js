import { NextResponse } from "next/server";

/**
 * Create a safe error response that doesn't leak sensitive information
 * @param {Error} error - The error object
 * @param {string} userMessage - Safe message to show to the user
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {NextResponse} - NextResponse with safe error message
 */
export function createSafeErrorResponse(error, userMessage = "An error occurred", statusCode = 500) {
  // Log the full error for debugging (in production, this goes to logs, not the user)
  console.error("Error:", error);

  // Never expose:
  // - Database connection strings
  // - Internal paths
  // - Stack traces
  // - SQL queries
  // - Environment variables

  // Return a safe, generic message to the user
  return NextResponse.json(
    { error: userMessage },
    { status: statusCode }
  );
}

/**
 * Check if error is a known type that can have a more specific message
 * @param {Error} error - The error object
 * @returns {Object} - { message: string, status: number }
 */
export function categorizeError(error) {
  const errorMessage = error.message?.toLowerCase() || "";

  // Prisma unique constraint violation
  if (errorMessage.includes("unique constraint")) {
    return {
      message: "A record with this information already exists",
      status: 409,
    };
  }

  // Prisma foreign key constraint violation
  if (errorMessage.includes("foreign key constraint")) {
    return {
      message: "Cannot perform this operation due to related records",
      status: 400,
    };
  }

  // Prisma record not found
  if (errorMessage.includes("record not found") || errorMessage.includes("not found")) {
    return {
      message: "The requested resource was not found",
      status: 404,
    };
  }

  // Database connection errors
  if (
    errorMessage.includes("connection") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("econnrefused")
  ) {
    return {
      message: "Service temporarily unavailable. Please try again later",
      status: 503,
    };
  }

  // JSON parsing errors
  if (errorMessage.includes("json") || errorMessage.includes("parse")) {
    return {
      message: "Invalid request format",
      status: 400,
    };
  }

  // Default to generic error
  return {
    message: "An internal error occurred",
    status: 500,
  };
}

/**
 * Create a smart error response that categorizes the error and returns appropriate message
 * @param {Error} error - The error object
 * @returns {NextResponse} - NextResponse with appropriate error message
 */
export function createSmartErrorResponse(error) {
  const { message, status } = categorizeError(error);
  return createSafeErrorResponse(error, message, status);
}

/**
 * Async error handler wrapper for API routes
 * @param {Function} handler - Async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
export function withErrorHandling(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createSmartErrorResponse(error);
    }
  };
}
