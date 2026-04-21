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

    const payments = (paymentsRes || []).map(p => ({
      ...p,
      ad_id: p.ads?.id,
      ad_title: p.ads?.title,
      ad_status: p.ads?.status,
      package_name: p.ads?.packages?.name,
      package_price: p.ads?.packages?.price,
      owner_name: p.ads?.users?.name,
      owner_email: p.ads?.users?.email,
      verified_by_name: p.users?.name,
      ads: undefined,
      users: undefined
    }));

    return successResponse({
      payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
