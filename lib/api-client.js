/**
 * Fetch wrapper with better error handling for JSON parsing
 */
export async function fetchJSON(url, options = {}) {
  try {
    const response = await fetch(url, options);

    // Get the text first to see what we're dealing with
    const text = await response.text();

    // Try to parse as JSON
    try {
      const data = JSON.parse(text);

      // If response is not ok, throw with the error data
      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (parseError) {
      // If JSON parse fails, log the actual response
      console.error('Failed to parse JSON response from:', url);
      console.error('Status:', response.status);
      console.error('Response text:', text.substring(0, 500)); // First 500 chars

      const error = new Error(
        `Invalid JSON response from ${url}: ${parseError.message}\nReceived: ${text.substring(0, 100)}...`
      );
      error.status = response.status;
      error.responseText = text;
      throw error;
    }
  } catch (error) {
    console.error('Fetch error for', url, error);
    throw error;
  }
}

/**
 * Common fetch options
 */
export const jsonHeaders = {
  'Content-Type': 'application/json',
};

/**
 * GET request helper
 */
export async function get(url) {
  return fetchJSON(url);
}

/**
 * POST request helper
 */
export async function post(url, data) {
  return fetchJSON(url, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request helper
 */
export async function patch(url, data) {
  return fetchJSON(url, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function del(url) {
  return fetchJSON(url, {
    method: 'DELETE',
  });
}
