import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Vercel Cron calls each /api/cron/* route with "Authorization: Bearer
 * <CRON_SECRET>". Fails closed: with CRON_SECRET unset (or too short to be a
 * secret) every request is refused. Both sides are hashed first, so the
 * constant-time compare also hides the expected length.
 */
export function isAuthorizedCron(authorization: string | null, secret = process.env.CRON_SECRET): boolean {
  if (!secret || secret.length < 16 || !authorization) return false;
  const given = createHash('sha256').update(authorization).digest();
  const expected = createHash('sha256').update(`Bearer ${secret}`).digest();
  return timingSafeEqual(given, expected);
}
