/**
 * API helper for making authenticated requests
 * Uses the internal API key when Clerk session auth might not be available
 */

const INTERNAL_API_KEY = process.env.NEXT_PUBLIC_INTERNAL_API_KEY;

/**
 * Make an authenticated API request
 * Falls back to internal API key with tenant slug if provided
 * @param {string} url - The API endpoint
 * @param {object} options - Fetch options
 * @param {string} tenantSlug - Optional tenant slug for internal API key auth
 * @returns {Promise<Response>}
 */
export async function apiRequest(url, options = {}, tenantSlug = null) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // If tenant slug is provided and we have an internal API key, use it
  if (tenantSlug && INTERNAL_API_KEY) {
    headers["x-api-key"] = INTERNAL_API_KEY;
    headers["x-tenant-slug"] = tenantSlug;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * GET request helper
 */
export async function apiGet(url, tenantSlug = null) {
  return apiRequest(url, { method: "GET" }, tenantSlug);
}

/**
 * POST request helper
 */
export async function apiPost(url, data, tenantSlug = null) {
  return apiRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    tenantSlug
  );
}

/**
 * PATCH request helper
 */
export async function apiPatch(url, data, tenantSlug = null) {
  return apiRequest(
    url,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    tenantSlug
  );
}

/**
 * DELETE request helper
 */
export async function apiDelete(url, tenantSlug = null) {
  return apiRequest(url, { method: "DELETE" }, tenantSlug);
}
