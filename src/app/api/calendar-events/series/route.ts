/**
 * Calendar Events Series API Endpoint
 * 
 * Handles operations on recurring event series
 * 
 * PUT /api/calendar-events/series
 * Updates all events in a recurring series
 * 
 * DELETE /api/calendar-events/series
 * Deletes all events in a recurring series
 * 
 * @author PerformTrack Team
 * @since Fase 2 - Advanced Features
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// PUT /api/calendar-events/series - Update all events in series
// ============================================================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, ...updateData } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the event to determine if it's parent or instance
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('id, recurrence_parent_id')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Determine parent ID
    const parentId = event.recurrence_parent_id || event.id;

    // Prepare update data (convert camelCase to snake_case)
    const allowedFields = [
      'title', 'description', 'type', 'status', 
      'workoutId', 'coachId', 'athleteIds', 'location', 'notes',
      'color', 'tags', 'metadata'
    ];

    const filteredData: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        filteredData[snakeField] = updateData[field];
      }
    });

    // Update parent event
    const { error: parentUpdateError } = await supabase
      .from('calendar_events')
      .update(filteredData)
      .eq('id', parentId);

    if (parentUpdateError) {
      console.error('Error updating parent event:', parentUpdateError);
      return NextResponse.json(
        { error: 'Failed to update parent event', details: parentUpdateError.message },
        { status: 500 }
      );
    }

    // Update all instance events
    const { error: instancesUpdateError, count } = await supabase
      .from('calendar_events')
      .update(filteredData)
      .eq('recurrence_parent_id', parentId);

    if (instancesUpdateError) {
      console.error('Error updating instance events:', instancesUpdateError);
      return NextResponse.json(
        { error: 'Failed to update instance events', details: instancesUpdateError.message },
        { status: 500 }
      );
    }

    // Update participants if athleteIds changed
    if (updateData.athleteIds) {
      // Get all event IDs in series
      const { data: seriesEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .or(`id.eq.${parentId},recurrence_parent_id.eq.${parentId}`);

      if (seriesEvents && seriesEvents.length > 0) {
        const eventIds = seriesEvents.map(e => e.id);

        // Delete existing participants
        await supabase
          .from('event_participants')
          .delete()
          .in('event_id', eventIds);

        // Create new participants
        const newParticipants = eventIds.flatMap(eventId =>
          updateData.athleteIds.map((athleteId: string) => ({
            event_id: eventId,
            athlete_id: athleteId,
            status: 'pending',
          }))
        );

        await supabase
          .from('event_participants')
          .insert(newParticipants);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated all events in series (${(count || 0) + 1} total)`,
      eventsUpdated: (count || 0) + 1,
    });
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/calendar-events/series:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/calendar-events/series - Delete all events in series
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the event to determine if it's parent or instance
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('id, recurrence_parent_id, title')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Determine parent ID
    const parentId = event.recurrence_parent_id || event.id;

    // Count how many events will be deleted
    const { count: instanceCount } = await supabase
      .from('calendar_events')
      .select('id', { count: 'exact', head: true })
      .eq('recurrence_parent_id', parentId);

    const totalToDelete = (instanceCount || 0) + 1; // instances + parent

    // Delete all instances
    const { error: instancesDeleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('recurrence_parent_id', parentId);

    if (instancesDeleteError) {
      console.error('Error deleting instance events:', instancesDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete instance events', details: instancesDeleteError.message },
        { status: 500 }
      );
    }

    // Delete parent event
    const { error: parentDeleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', parentId);

    if (parentDeleteError) {
      console.error('Error deleting parent event:', parentDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete parent event', details: parentDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deleted entire series (${totalToDelete} events)`,
      eventsDeleted: totalToDelete,
    });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/calendar-events/series:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
