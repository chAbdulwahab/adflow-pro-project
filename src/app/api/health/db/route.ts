import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const start = Date.now();
  const { error } = await supabaseAdmin.from('packages').select('id').limit(1);
  const ms = Date.now() - start;

  await supabaseAdmin.from('system_health_logs').insert({
    source: 'database',
    status: error ? 'error' : 'success',
    response_ms: ms,
    error_message: error?.message || null,
  });

  return NextResponse.json({
    status: error ? 'unhealthy' : 'healthy',
    response_ms: ms,
    timestamp: new Date().toISOString(),
  });
}
