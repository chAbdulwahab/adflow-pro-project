import { NextRequest } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Validate that an incoming request carries the correct CRON_SECRET.
 *
 * Vercel sends it as: Authorization: Bearer <CRON_SECRET>
 * We also accept it as: x-cron-secret: <CRON_SECRET>  (for local testing)
 *
 * @returns true if valid, false otherwise
 */
export function isCronAuthorized(req: NextRequest): boolean {
  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not set in environment variables');
    return false;
  }

  // Vercel production: Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;

  // Local dev: x-cron-secret header
  const cronHeader = req.headers.get('x-cron-secret');
  if (cronHeader === CRON_SECRET) return true;

  return false;
}
