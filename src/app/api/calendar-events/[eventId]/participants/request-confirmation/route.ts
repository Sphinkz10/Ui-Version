/**
 * REQUEST CONFIRMATION API
 * 
 * Send confirmation request to participants
 * 
 * Endpoints:
 * - POST /api/calendar-events/[eventId]/participants/request-confirmation
 * 
 * @created 18 Janeiro 2026
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// POST - Request Confirmation
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient();
    const { eventId } = params;
    const body = await request.json();

    const { athleteIds, workspaceId, sendAll = false } = body;

    // Validation
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!sendAll && (!athleteIds || !Array.isArray(athleteIds) || athleteIds.length === 0)) {
      return NextResponse.json(
        { error: 'athleteIds must be a non-empty array or sendAll must be true' },
        { status: 400 }
      );
    }

    // Verify event exists and belongs to workspace
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .select('workspace_id, title, start_date, end_date, location, type')
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
      .select(`
        id,
        athlete_id,
        status,
        athletes:athlete_id (
          id,
          name,
          email,
          avatar_url,
          team
        )
      `)
      .eq('event_id', eventId);

    if (!sendAll) {
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

    // Filter only pending participants (don't resend to confirmed/declined)
    const pendingParticipants = participants.filter(p => 
      p.status === 'pending' || !p.status
    );

    if (pendingParticipants.length === 0) {
      return NextResponse.json(
        { 
          error: 'No pending participants to send confirmation to',
          message: 'All selected participants have already confirmed or declined',
        },
        { status: 400 }
      );
    }

    // Update confirmation_sent_at timestamp
    const now = new Date().toISOString();
    const participantIds = pendingParticipants.map(p => p.id);

    const { error: updateError } = await supabase
      .from('event_participants')
      .update({
        confirmation_sent_at: now,
      })
      .in('id', participantIds);

    if (updateError) {
      console.error('Error updating participants:', updateError);
      return NextResponse.json(
        { error: 'Failed to update participants' },
        { status: 500 }
      );
    }

    // In a real app, you would:
    // 1. Generate unique confirmation token for each participant
    // 2. Send email with link: /confirm/[token]
    // 3. Store notification in notifications table
    // 4. Send push notification if mobile app exists

    // For MVP, we'll simulate this with a simple status update
    // Athletes can confirm via the participant management UI

    return NextResponse.json({
      sent: pendingParticipants.length,
      skipped: participants.length - pendingParticipants.length,
      participants: pendingParticipants.map(p => ({
        id: p.id,
        athlete_id: p.athlete_id,
        athlete_name: p.athletes?.name,
      })),
      message: `Confirmation request sent to ${pendingParticipants.length} participant${pendingParticipants.length !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('Error in request confirmation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
