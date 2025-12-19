/**
 * Sign-up state management using localStorage
 * This state persists during the sign-up flow before authentication
 */

const STORAGE_KEY = 'clientflow_signup_state';

const DEFAULT_STATE = {
  step: 1,
  firstName: '',
  lastName: '',
  email: '',
  businessName: '',
  slug: '',
  emailVerified: false,
};

/**
 * Get the current sign-up state from localStorage
 * @returns {object} The sign-up state
 */
export function getSignupState() {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { ...DEFAULT_STATE };
    }
    return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error reading signup state:', error);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Update the sign-up state in localStorage
 * @param {object} updates - Partial state updates
 * @returns {object} The updated state
 */
export function updateSignupState(updates) {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE, ...updates };
  }

  try {
    const current = getSignupState();
    const newState = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
  } catch (error) {
    console.error('Error updating signup state:', error);
    return { ...DEFAULT_STATE, ...updates };
  }
}

/**
 * Clear the sign-up state from localStorage
 * Called after successful payment/registration
 */
export function clearSignupState() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing signup state:', error);
  }
}

/**
 * Check if user can access a specific step
 * @param {number} targetStep - The step to check
 * @returns {boolean} Whether the user can access the step
 */
export function canAccessStep(targetStep) {
  const state = getSignupState();
  const currentStep = state.step;

  // Can always go back
  if (targetStep < currentStep) {
    return true;
  }

  // Can only go forward one step at a time
  if (targetStep > currentStep + 1) {
    return false;
  }

  // Check requirements for each step
  switch (targetStep) {
    case 1:
      return true;
    case 2:
      // Need verified email to access step 2
      return state.emailVerified && state.firstName && state.lastName && state.email;
    case 3:
      // Need business name and slug to access step 3
      return state.businessName && state.slug;
    default:
      return false;
  }
}

/**
 * Generate a slug from a business name
 * @param {string} name - The business name
 * @returns {string} The generated slug
 */
export function generateSlug(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}
