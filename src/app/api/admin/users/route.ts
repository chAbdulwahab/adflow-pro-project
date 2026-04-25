import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireRole } from '@/lib/auth';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let query = supabaseAdmin
      .from('users')
      .select(`
        id, name, email, role, created_at,
        seller_profiles ( id, is_verified, display_name, business_name )
      `)
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    // Flatten data for frontend
    const flattened = (users || []).map(u => {
      const profile = Array.isArray(u.seller_profiles) ? u.seller_profiles[0] : u.seller_profiles;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        is_verified: profile?.is_verified || false,
        profile_id: profile?.id
      };
    });

    return successResponse({ users: flattened });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    requireRole(req, 'admin', 'super_admin');
    const { userId, isVerified } = await req.json();

    if (!userId) return errorResponse('userId is required', 400);

    // 1. Check if profile exists
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('seller_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!profile) {
      // Create profile if missing
      const { error: createError } = await supabaseAdmin
        .from('seller_profiles')
        .insert({ user_id: userId, is_verified: isVerified });
      if (createError) throw createError;
    } else {
      // Update existing profile
      const { error: updateError } = await supabaseAdmin
        .from('seller_profiles')
        .update({ is_verified: isVerified })
        .eq('user_id', userId);
      if (updateError) throw updateError;
    }

    return successResponse({ message: `User verification status updated to ${isVerified}` });
  } catch (error: any) {
    return handleAuthError(error);
  }
}
