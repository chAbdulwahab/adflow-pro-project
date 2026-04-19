/**
 * Calculate freshness points based on how long ago the ad was published.
 * Newer ads get more points.
 */
export function getFreshnessPoints(publishAt: Date | string | null): number {
  if (!publishAt) return 0;

  const pubDate = typeof publishAt === 'string' ? new Date(publishAt) : publishAt;
  const hoursAlive = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

  if (hoursAlive < 24)  return 20; // < 1 day
  if (hoursAlive < 72)  return 15; // < 3 days
  if (hoursAlive < 168) return 10; // < 1 week
  if (hoursAlive < 336) return 5;  // < 2 weeks
  return 0;
}

interface RankInputs {
  is_featured: boolean;
  package_weight: number;
  publish_at: Date | string | null;
  admin_boost: number;
  seller_is_verified: boolean;
}

/**
 * Calculate the rank score for an ad.
 * Higher score = higher position in listings.
 *
 * Formula:
 *   featured (50) + packageWeight×10 + freshness(0-20) + adminBoost + verified(5)
 */
export function calculateRankScore(inputs: RankInputs): number {
  const {
    is_featured,
    package_weight,
    publish_at,
    admin_boost,
    seller_is_verified,
  } = inputs;

  const score =
    (is_featured ? 50 : 0) +
    (package_weight * 10) +
    getFreshnessPoints(publish_at) +
    (admin_boost || 0) +
    (seller_is_verified ? 5 : 0);

  return Math.round(score * 100) / 100; // Round to 2 decimals
}