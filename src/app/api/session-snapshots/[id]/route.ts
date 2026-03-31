/**
 * Session Snapshot Detail API - SEMANA 2 DIA 1
 * 
 * GET    /api/session-snapshots/[id] - Get snapshot by ID
 * DELETE /api/session-snapshots/[id] - Delete snapshot (soft delete recommended)
 * 
 * @author PerformTrack Team
 * @since Week 2 - Session Snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/session-snapshots/[id] - Get snapshot details
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch snapshot with related data
    const { data: snapshot, error } = await supabase
      .from('session_snapshots')
      .select(`
        *,
        athlete:athletes(id, name, email, avatar_url, date_of_birth, metadata),
        template:workouts(id, name, category, description, estimated_duration, intensity, metadata),
        calendar_event:calendar_events(id, title, start_date, end_date, location),
        metrics:snapshot_metrics(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Snapshot not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching snapshot:', error);
      return NextResponse.json(
        { error: 'Failed to fetch snapshot', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ snapshot });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/session-snapshots/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/session-snapshots/[id] - Delete snapshot
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete metrics first (foreign key constraint)
    const { error: metricsError } = await supabase
      .from('snapshot_metrics')
      .delete()
      .eq('snapshot_id', id);

    if (metricsError) {
      console.error('Error deleting metrics:', metricsError);
      // Continue anyway
    }

    // Delete snapshot
    const { error: deleteError } = await supabase
      .from('session_snapshots')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting snapshot:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete snapshot', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Snapshot deleted successfully',
      id
    });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/session-snapshots/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
