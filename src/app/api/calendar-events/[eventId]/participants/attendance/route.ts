/**
 * ATTENDANCE TRACKING API
 * 
 * Endpoints:
 * - POST /api/calendar-events/[eventId]/participants/attendance - Mark attendance (bulk or individual)
 * - GET /api/calendar-events/[eventId]/participants/attendance - Get attendance summary
 * 
 * @created 18 Janeiro 2026
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// ============================================================================
// POST - Mark Attendance
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient();
    const { eventId } = params;
    const body = await request.json();

    const { 
      workspaceId, 
      athleteIds, 
      status, 
      markAll = false,
      notes 
    } = body as {
      workspaceId: string;
      athleteIds?: string[];
      status: AttendanceStatus;
      markAll?: boolean;
      notes?: string;
    };

    // Validation
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!status || !['present', 'absent', 'late', 'excused'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: present, absent, late, excused' },
        { status: 400 }
      );
    }

    if (!markAll && (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length === 0)) {
      return NextResponse.json(
        { error: 'athleteIds must be a non-empty array or markAll must be true' },
        { status: 400 }
      );
    }

    // Verify event exists and belongs to workspace
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('workspace_id, title, start_date')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.workspace_id !== workspaceId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get participants to update
    let query = supabase
      .from('event_participants')
      .select('id, athlete_id')
      .eq('event_id', eventId);

    if (!markAll && athleteIds) {
      query = query.in('athlete_id', athleteIds);
    }

    const { data: participants, error: participantsError } = await query;

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants found' },
        { status: 404 }
      );
    }

    // Update attendance
    const now = new Date().toISOString();
    const participantIds = participants.map(p => p.id);

    const updateData: any = {
      attendance_status: status,
      attendance_marked_at: now,
    };

    if (notes) {
      updateData.attendance_notes = notes;
    }

    const { data: updated, error: updateError } = await supabase
      .from('event_participants')
      .update(updateData)
      .in('id', participantIds)
      .select(`
        id,
        athlete_id,
        attendance_status,
        attendance_marked_at,
        attendance_notes,
        athletes:athlete_id (
          id,
          name,
          email,
          avatar_url,
          team
        )
      `);

    if (updateError) {
      console.error('Error updating attendance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update attendance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updated: updated?.length || 0,
      participants: updated || [],
      message: `Attendance marked as ${status} for ${updated?.length || 0} participant${updated?.length !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error in mark attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Attendance Summary
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient();
    const { eventId } = params;
    
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspace_id');
    
    // Validation
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }
    
    // Verify event
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('workspace_id, title, start_date')
      .eq('id', eventId)
      .single();
    
    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    if (event.workspace_id !== workspaceId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get participants with attendance
    const { data: participants, error: participantsError } = await supabase
      .from('event_participants')
      .select(`
        id,
        athlete_id,
        attendance_status,
        attendance_marked_at,
        attendance_notes,
        athletes:athlete_id (
          id,
          name,
          email,
          avatar_url,
          team
        )
      `)
      .eq('event_id', eventId);
    
    if (participantsError) {
      console.error('Error fetching attendance:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance' },
        { status: 500 }
      );
    }
    
    // Calculate summary
    const total = participants?.length || 0;
    const present = participants?.filter(p => p.attendance_status === 'present').length || 0;
    const absent = participants?.filter(p => p.attendance_status === 'absent').length || 0;
    const late = participants?.filter(p => p.attendance_status === 'late').length || 0;
    const excused = participants?.filter(p => p.attendance_status === 'excused').length || 0;
    const notMarked = participants?.filter(p => !p.attendance_status).length || 0;
    
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        start_date: event.start_date,
      },
      summary: {
        total,
        present,
        absent,
        late,
        excused,
        notMarked,
        attendanceRate,
      },
      participants: participants || [],
    });
    
  } catch (error) {
    console.error('Error in get attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
