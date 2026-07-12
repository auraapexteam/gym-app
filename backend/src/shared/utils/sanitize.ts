/**
 * Pure string helpers. Utilities must never contain business logic.
 */

/** Lowercase and trim an email for consistent storage and lookups. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Trim a string, returning undefined when the result is empty. */
export const trimOrUndefined = (value?: string | null): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

/** Escape a value for safe use inside a Postgres `ILIKE` pattern. */
export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, (match) => `\\${match}`);
