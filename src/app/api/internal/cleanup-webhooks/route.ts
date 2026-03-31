/**
 * Cleanup Old Webhook Deliveries - Internal API
 * 
 * POST /api/internal/cleanup-webhooks
 * Deletes webhook deliveries older than 30 days.
 * 
 * This should only be called by scheduled jobs (secured).
 * 
 * @author PerformTrack Team
 * @since Fase 6 - Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Delete deliveries older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deleted, error } = await supabase
      .from('webhook_deliveries')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up webhook deliveries:', error);
      return NextResponse.json(
        { error: 'Failed to cleanup webhooks', details: error.message },
        { status: 500 }
      );
    }

    const deletedCount = deleted?.length || 0;

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      cutoffDate: thirtyDaysAgo.toISOString(),
    });
  } catch (error: any) {
    console.error('Unexpected error in cleanup-webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
