/** Minimum password length accepted at registration (Supabase enforces the rest). */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Password complexity regex.
 * Requires at least:
 *   - 1 uppercase letter  (A-Z)
 *   - 1 digit             (0-9)
 *   - 1 special character (!@#$%^&*…)
 */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one uppercase letter, one number, and one special character';
