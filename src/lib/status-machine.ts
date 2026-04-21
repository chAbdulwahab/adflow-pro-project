import { supabaseAdmin } from '@/lib/supabase';
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
 * Transition an ad to a new status using Supabase client.
 *
 * - Validates the transition is allowed per the state machine
 * - Updates ads.status
 * - Logs to ad_status_history
 * - Logs to audit_logs
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
  const { data: ad, error: fetchError } = await supabaseAdmin
    .from('ads')
    .select('id, status')
    .eq('id', adId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!ad) {
    throw new Error(`Ad not found: ${adId}`);
  }

  const currentStatus = ad.status as AdStatus;

  // 2. Validate transition against state machine
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid transition: '${currentStatus}' → '${newStatus}'. Allowed: [${allowedNext.join(', ') || 'none'}]`
    );
  }

  // 3. Execute sequential updates
  // Update ads table
  const { error: updateError } = await supabaseAdmin
    .from('ads')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', adId);
  
  if (updateError) throw updateError;

  // Log to ad_status_history
  const { error: historyError } = await supabaseAdmin
    .from('ad_status_history')
    .insert({
      ad_id: adId,
      previous_status: currentStatus,
      new_status: newStatus,
      changed_by: actorId,
      note: note ?? null
    });
  
  if (historyError) throw historyError;

  // Log to audit_logs
  const { error: auditError } = await supabaseAdmin
    .from('audit_logs')
    .insert({
      actor_id: actorId,
      action_type: 'status_change',
      target_type: 'ad',
      target_id: adId,
      old_value: { status: currentStatus },
      new_value: { status: newStatus },
      ip_address: ipAddress ?? null,
    });
  
  if (auditError) throw auditError;

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
