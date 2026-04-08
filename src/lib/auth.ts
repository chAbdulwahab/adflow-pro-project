import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'adflow_secret';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export function verifyToken(req: NextRequest): JWTPayload | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const payload = verifyToken(req);
  if (!payload) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user: payload };
}
