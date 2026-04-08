import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'adflow_secret';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = 'client' } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    if (!['client', 'moderator', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check existing
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash,
        role,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Register DB error:', error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Create seller profile for clients
    if (role === 'client') {
      await supabaseAdmin.from('seller_profiles').insert({
        user_id: user.id,
        display_name: name,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        token,
        message: 'Registration successful',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
