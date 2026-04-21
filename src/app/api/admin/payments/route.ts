import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

// ============================================
// GET /api/admin/payments — Step 14: Admin payment queue
// Lists all payments awaiting verification
// Requires: admin or super_admin
// ============================================
export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'pending';
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const offset = (page - 1) * limit;

    const allowedStatuses = ['pending', 'verified', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(`status must be one of: ${allowedStatuses.join(', ')}`, 400);
    }

    const { data: paymentsRes, count, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id, amount, method, transaction_ref, sender_name,
        screenshot_url, status, rejection_note, created_at,
        verified_at,
        ads!inner (
          id, title, status,
          packages ( name, price ),
          users!inner ( name, email )
        ),
        users!verified_by ( name )
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;

    const payments = (paymentsRes || []).map(p => {
      const ad = Array.isArray(p.ads) ? p.ads[0] : p.ads;
      const pkg = Array.isArray(ad?.packages) ? ad.packages[0] : ad?.packages;
      const owner = Array.isArray(ad?.users) ? ad.users[0] : ad?.users;
      const verifier = Array.isArray(p.users) ? p.users[0] : p.users;

      return {
        ...p,
        ad_id: ad?.id,
        ad_title: ad?.title,
        ad_status: ad?.status,
        package_name: pkg?.name,
        package_price: pkg?.price,
        owner_name: owner?.name,
        owner_email: owner?.email,
        verified_by_name: verifier?.name,
        ads: undefined,
        users: undefined
      };
    });

    return successResponse({
      payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
