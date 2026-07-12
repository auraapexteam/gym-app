import { randomBytes, randomUUID, timingSafeEqual } from 'crypto';

/** Generate a URL-safe opaque token (used for QR payloads, etc.). */
export const generateOpaqueToken = (bytes = 24): string =>
  randomBytes(bytes).toString('base64url');

/** Generate a v4 UUID. */
export const generateId = (): string => randomUUID();

/** Constant-time string comparison to avoid timing side-channels. */
export const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};
