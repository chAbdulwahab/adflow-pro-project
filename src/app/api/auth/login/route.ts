import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, signToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    // 1. Validate
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    // 2. Find user using Supabase client
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password_hash, role, status')
      .eq('email', email)
      .maybeSingle();

    if (userError) throw userError;

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    // 3. Check account status
    if (user.status !== 'active') {
      return errorResponse(
        `Account is ${user.status}. Contact support.`,
        403
      );
    }

    // 4. Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return errorResponse('Invalid credentials', 401);
    }

    // 5. Issue token
    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return successResponse({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse(error.message || 'Login failed', 500);
  }
}