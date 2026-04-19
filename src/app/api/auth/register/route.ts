import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
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

    // 2. Check if email already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return errorResponse('Email already registered', 409);
    }

    // 3. Hash password
    const password_hash = await hashPassword(password);

    // 4. Insert user (default role: client)
    const userResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, status, created_at`,
      [name, email, password_hash, ROLES.CLIENT]
    );
    const user = userResult.rows[0];

    // 5. Create seller profile with the extra info
    await db.query(
      `INSERT INTO seller_profiles (user_id, display_name, phone, city, business_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, name, phone, city, business_name || null]
    );

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