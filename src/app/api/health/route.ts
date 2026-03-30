import { NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/client';

export const dynamic = 'force-dynamic'; // Ensure this route is never cached statically

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Check database connectivity
    const { error } = await supabase.from('workspaces').select('id').limit(1);
    
    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: Date.now(),
      version: process.env.VITE_APP_VERSION || '1.0.0'
    }, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      db: 'disconnected',
      message: error instanceof Error ? error.message : 'Unknown database error'
    }, { status: 503 });
  }
}
