/**
 * Password validation rules and strength calculation
 * Rules:
 * - Minimum 8 characters
 * - At least 1 letter
 * - At least 1 number
 * - At least 1 special character
 * - Cannot contain first/last name
 * - Cannot contain email prefix
 */

const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';

export const PASSWORD_RULES = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    id: 'letter',
    label: 'At least 1 letter',
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    id: 'number',
    label: 'At least 1 number',
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'At least 1 special character',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/`~]/.test(password),
  },
];

/**
 * Validate password against all rules
 * @param {string} password - The password to validate
 * @param {object} context - Optional context with firstName, lastName, email
 * @returns {object} - { isValid, errors, passedRules, failedRules }
 */
export function validatePassword(password, context = {}) {
  const { firstName = '', lastName = '', email = '' } = context;
  const errors = [];
  const passedRules = [];
  const failedRules = [];

  // Check standard rules
  PASSWORD_RULES.forEach((rule) => {
    if (rule.test(password)) {
      passedRules.push(rule.id);
    } else {
      failedRules.push(rule.id);
      errors.push(rule.label);
    }
  });

  // Check for name in password (case insensitive)
  const passwordLower = password.toLowerCase();

  if (firstName && firstName.length >= 2 && passwordLower.includes(firstName.toLowerCase())) {
    failedRules.push('no-name');
    errors.push('Cannot contain your first name');
  }

  if (lastName && lastName.length >= 2 && passwordLower.includes(lastName.toLowerCase())) {
    failedRules.push('no-name');
    errors.push('Cannot contain your last name');
  }

  // Check for email prefix in password
  if (email) {
    const emailPrefix = email.split('@')[0].toLowerCase();
    if (emailPrefix.length >= 3 && passwordLower.includes(emailPrefix)) {
      failedRules.push('no-email');
      errors.push('Cannot contain your email username');
    }
  }

  return {
    isValid: failedRules.length === 0,
    errors,
    passedRules,
    failedRules,
  };
}

/**
 * Calculate password strength (0-100)
 * @param {string} password - The password to evaluate
 * @returns {object} - { score, level, label, color }
 */
export function calculatePasswordStrength(password) {
  if (!password) {
    return { score: 0, level: 0, label: '', color: 'bg-muted' };
  }

  let score = 0;

  // Length scoring (up to 30 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety (up to 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/`~]/.test(password)) score += 10;

  // Bonus points (up to 30 points)
  // Mixed case
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 10;
  // Multiple special characters
  const specialCount = (password.match(/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/`~]/g) || []).length;
  if (specialCount >= 2) score += 10;
  // Multiple numbers
  const numberCount = (password.match(/[0-9]/g) || []).length;
  if (numberCount >= 2) score += 10;

  // Cap at 100
  score = Math.min(score, 100);

  // Determine level and label
  let level, label, color;
  if (score < 25) {
    level = 1;
    label = 'Weak';
    color = 'bg-red-500';
  } else if (score < 50) {
    level = 2;
    label = 'Fair';
    color = 'bg-orange-500';
  } else if (score < 75) {
    level = 3;
    label = 'Good';
    color = 'bg-yellow-500';
  } else {
    level = 4;
    label = 'Strong';
    color = 'bg-green-500';
  }

  return { score, level, label, color };
}

/**
 * Get all validation rules including contextual ones
 * @param {object} context - Optional context with firstName, lastName, email
 * @returns {array} - Array of all rules with current status
 */
export function getAllRules(context = {}) {
  const rules = [...PASSWORD_RULES];

  const { firstName, lastName, email } = context;

  if (firstName || lastName) {
    rules.push({
      id: 'no-name',
      label: 'Cannot contain your name',
      test: (password) => {
        const pwLower = password.toLowerCase();
        if (firstName && firstName.length >= 2 && pwLower.includes(firstName.toLowerCase())) {
          return false;
        }
        if (lastName && lastName.length >= 2 && pwLower.includes(lastName.toLowerCase())) {
          return false;
        }
        return true;
      },
    });
  }

  if (email) {
    const emailPrefix = email.split('@')[0];
    if (emailPrefix.length >= 3) {
      rules.push({
        id: 'no-email',
        label: 'Cannot contain email username',
        test: (password) => !password.toLowerCase().includes(emailPrefix.toLowerCase()),
      });
    }
  }

  return rules;
}
