import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { profileUpdateSchema } from '@/lib/validators';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    // Require auth
    const authUser = requireAuth(req);

    // Fetch fresh user data from DB using Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id, name, email, role, status, created_at,
        seller_profiles (
          display_name, business_name, phone, city, is_verified
        )
      `)
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return successResponse({ user: null }, 404);
    }

    // Flatten the user object to match the previous structure if needed
    const sellerProf = Array.isArray(user.seller_profiles) ? user.seller_profiles[0] : user.seller_profiles;
    const userResponse = {
      ...user,
      display_name: sellerProf?.display_name,
      business_name: sellerProf?.business_name,
      phone: sellerProf?.phone,
      city: sellerProf?.city,
      is_verified: sellerProf?.is_verified,
      seller_profiles: undefined
    };

    return successResponse({ user: userResponse });
  } catch (error: any) {
    return handleAuthError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = requireAuth(req);

    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, phone, city, business_name } = parsed.data;

    // Update users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', authUser.id);

    if (userError) throw userError;

    // Update seller_profiles table
    const { error: profileError } = await supabaseAdmin
      .from('seller_profiles')
      .update({
        display_name: name,
        phone,
        city,
        business_name: business_name || null
      })
      .eq('user_id', authUser.id);

    if (profileError) throw profileError;

    return successResponse({ message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return handleAuthError(error);
  }
}