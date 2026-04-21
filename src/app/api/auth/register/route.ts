import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, signToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ROLES } from '@/constants';

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Validation failed', 400, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, phone, city, business_name } = parsed.data;

    // 2. Check if email already exists using Supabase
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return errorResponse('Email already registered', 409);
    }

    // 3. Hash password
    const password_hash = await hashPassword(password);

    // 4. Insert user (default role: client)
    const { data: user, error: userInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        role: ROLES.CLIENT
      })
      .select('id, name, email, role, status, created_at')
      .single();

    if (userInsertError) throw userInsertError;

    // 5. Create seller profile with the extra info
    const { error: profileError } = await supabaseAdmin
      .from('seller_profiles')
      .insert({
        user_id: user.id,
        display_name: name,
        phone,
        city,
        business_name: business_name || null
      });

    if (profileError) throw profileError;

    // 6. Issue JWT
    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return successResponse(
      {
        message: 'Registered successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      201
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return errorResponse(error.message || 'Registration failed', 500);
  }
}