import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { profileUpdateSchema } from '@/lib/validators';
import { successResponse, errorResponse, handleAuthError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    // Require auth
    const authUser = requireAuth(req);

    // Fetch fresh user data from DB
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at,
              sp.display_name, sp.business_name, sp.phone, sp.city, sp.is_verified
       FROM users u
       LEFT JOIN seller_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [authUser.id]
    );

    if (result.rows.length === 0) {
      return successResponse({ user: null }, 404);
    }

    return successResponse({ user: result.rows[0] });
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

    // Start a transaction since we update two tables
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update users table
      await client.query(
        `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
        [name, authUser.id]
      );

      // Update seller_profiles table
      await client.query(
        `UPDATE seller_profiles 
         SET display_name = $1, phone = $2, city = $3, business_name = $4
         WHERE user_id = $5`,
        [name, phone, city, business_name || null, authUser.id]
      );

      await client.query('COMMIT');

      return successResponse({ message: 'Profile updated successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Profile update error:', error);
    return handleAuthError(error);
  }
}