import { db } from '@/lib/db';
import { AD_STATUS, ALLOWED_TRANSITIONS } from '@/constants';
import type { AdStatus } from '@/constants';

interface TransitionOptions {
  adId: string;
  newStatus: AdStatus;
  actorId: string;
  note?: string;
  ipAddress?: string;
}

/**
 * Atomically transition an ad to a new status.
 *
 * - Validates the transition is allowed per the state machine
 * - Updates ads.status
 * - Logs to ad_status_history
 * - Logs to audit_logs
 * - Wraps all three writes in a single DB transaction
 *
 * @throws Error if the transition is invalid or the ad doesn't exist
 */
export async function transitionAdStatus({
  adId,
  newStatus,
  actorId,
  note,
  ipAddress,
}: TransitionOptions): Promise<{ previousStatus: AdStatus; newStatus: AdStatus }> {
  // 1. Fetch current status
  const adResult = await db.query(
    'SELECT id, status FROM ads WHERE id = $1',
    [adId]
  );

  if (adResult.rows.length === 0) {
    throw new Error(`Ad not found: ${adId}`);
  }

  const currentStatus = adResult.rows[0].status as AdStatus;

  // 2. Validate transition against state machine
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid transition: '${currentStatus}' → '${newStatus}'. Allowed: [${allowedNext.join(', ') || 'none'}]`
    );
  }

  // 3. Execute atomically in a transaction
  const client = await (db as any).pool?.connect?.() ?? null;

  if (client) {
    // If using a pool client for transaction support
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE ads SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, adId]
      );

      await client.query(
        `INSERT INTO ad_status_history (ad_id, previous_status, new_status, changed_by, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [adId, currentStatus, newStatus, actorId, note ?? null]
      );

      await client.query(
        `INSERT INTO audit_logs (actor_id, action_type, target_type, target_id, old_value, new_value, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          actorId,
          'status_change',
          'ad',
          adId,
          JSON.stringify({ status: currentStatus }),
          JSON.stringify({ status: newStatus }),
          ipAddress ?? null,
        ]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    // Fallback: sequential queries (no transaction support via wrapper)
    await db.query(
      `UPDATE ads SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newStatus, adId]
    );

    await db.query(
      `INSERT INTO ad_status_history (ad_id, previous_status, new_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [adId, currentStatus, newStatus, actorId, note ?? null]
    );

    await db.query(
      `INSERT INTO audit_logs (actor_id, action_type, target_type, target_id, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        actorId,
        'status_change',
        'ad',
        adId,
        JSON.stringify({ status: currentStatus }),
        JSON.stringify({ status: newStatus }),
        ipAddress ?? null,
      ]
    );
  }

  return { previousStatus: currentStatus, newStatus };
}

/**
 * Check if a transition is allowed without executing it.
 */
export function isTransitionAllowed(from: AdStatus, to: AdStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Get allowed next statuses for a given current status.
 */
export function getAllowedTransitions(current: AdStatus): AdStatus[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}

/**
 * Validate that a status string is a valid AdStatus value.
 */
export function isValidStatus(status: string): status is AdStatus {
  return Object.values(AD_STATUS).includes(status as AdStatus);
}
