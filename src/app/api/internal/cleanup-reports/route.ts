/**
 * Cleanup Expired Reports - Internal API
 * 
 * POST /api/internal/cleanup-reports
 * Deletes report executions older than 30 days.
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

    // Delete executions older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deleted, error } = await supabase
      .from('report_executions')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up reports:', error);
      return NextResponse.json(
        { error: 'Failed to cleanup reports', details: error.message },
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
    console.error('Unexpected error in cleanup-reports:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
