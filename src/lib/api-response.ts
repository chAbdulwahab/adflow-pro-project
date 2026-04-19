import { NextResponse } from 'next/server';

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function errorResponse(message: string, status = 400, extra?: any) {
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status }
  );
}

/**
 * Handle common auth errors thrown from requireAuth/requireRole
 */
export function handleAuthError(error: any) {
  if (error.message === 'UNAUTHORIZED') {
    return errorResponse('Authentication required', 401);
  }
  if (error.message === 'FORBIDDEN') {
    return errorResponse('Insufficient permissions', 403);
  }
  console.error('API Error:', error);
  return errorResponse(error.message || 'Internal server error', 500);
}