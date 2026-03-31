/**
 * Calendar Events API Endpoint - FASE 3 CALENDAR INTEGRATION
 * 
 * GET /api/calendar-events
 * Returns calendar events for the current workspace.
 * 
 * Query params:
 * - workspaceId: string (required)
 * - startDate?: string (ISO 8601) - filter events after this date
 * - endDate?: string (ISO 8601) - filter events before this date
 * - type?: 'workout' | 'game' | 'competition' | 'rest' | 'meeting' | 'testing' | 'other'
 * - status?: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'postponed'
 * - athleteId?: string - filter events for specific athlete
 * - coachId?: string - filter events by coach
 * - includeDetails?: boolean (default: false) - include workout and athlete details
 * 
 * POST /api/calendar-events
 * Creates a new calendar event.
 * 
 * Body:
 * {
 *   workspaceId: string,
 *   title: string,
 *   description?: string,
 *   type: string,
 *   startDate: string (ISO 8601),
 *   endDate: string (ISO 8601),
 *   workoutId?: string,
 *   planId?: string,
 *   classId?: string,
 *   coachId?: string,
 *   athleteIds?: string[],
 *   location?: string,
 *   notes?: string,
 *   color?: string,
 *   tags?: string[],
 *   maxParticipants?: number,
 *   recurrencePattern?: object,
 *   metadata?: object
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 3 - Calendar Integration
 * @reference ARQUITETURA_DEFINITIVA_BASE_DADOS_03_JAN_2025.md - Camada 6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { dispatchCalendarEvent } from '@/utils/events/dispatcher';
import { generateInstances, patternToRRule } from '@/utils/recurrence';
import type { RecurrencePattern } from '@/components/calendar/components/RecurrenceSettings';

// ============================================================================
// GET /api/calendar-events - List events
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract params
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const athleteId = searchParams.get('athleteId');
    const coachId = searchParams.get('coachId');
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Validate required params
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Choose table based on includeDetails
    const tableName = includeDetails ? 'calendar_events_with_details' : 'calendar_events';
    
    // Build query
    let query = supabase
      .from(tableName)
      .select(`
        *
        ${includeDetails ? `,
        confirmations:event_confirmations(
          id,
          athlete_id,
          status,
          response_date,
          decline_reason
        )` : ''}
      `)
      .eq('workspace_id', workspaceId)
      .order('start_date', { ascending: true });

    // Apply date filters
    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    // Apply type filter
    if (type) {
      query = query.eq('type', type);
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by coach
    if (coachId) {
      query = query.eq('coach_id', coachId);
    }

    // Filter by athlete (array contains)
    if (athleteId) {
      query = query.contains('athlete_ids', [athleteId]);
    }

    // Execute query
    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching calendar events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: error.message },
        { status: 500 }
      );
    }

    // ✅ MOCK DATA REMOVED - Database is now seeded with demo data
    // If you need demo data, run: /supabase/seeds/001_calendar_demo_data.sql
    
    return NextResponse.json({
      events: events || [],
      count: events?.length || 0,
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/calendar-events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/calendar-events - Create new event
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { workspaceId, title, type, startDate, endDate } = body;

    if (!workspaceId || !title || !type || !startDate || !endDate) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['workspaceId', 'title', 'type', 'startDate', 'endDate']
        },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601.' },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ==============================================================
    // OPTIONAL: Check for conflicts if athleteIds provided
    // ==============================================================
    if (body.athleteIds && Array.isArray(body.athleteIds) && body.athleteIds.length > 0) {
      const { data: conflicts, error: conflictError } = await supabase
        .rpc('check_event_conflicts', {
          p_workspace_id: workspaceId,
          p_athlete_ids: body.athleteIds,
          p_start_date: startDate,
          p_end_date: endDate,
          p_exclude_event_id: null,
        });

      if (conflictError) {} else if (conflicts && conflicts.length > 0) {}
    }

    // ==============================================================
    // Create event
    // ==============================================================
    const { data: event, error: eventError } = await supabase
      .from('calendar_events')
      .insert({
        workspace_id: workspaceId,
        title,
        description: body.description || null,
        type,
        status: body.status || 'scheduled',
        start_date: startDate,
        end_date: endDate,
        workout_id: body.workoutId || null,
        plan_id: body.planId || null,
        class_id: body.classId || null,
        coach_id: body.coachId || null,
        athlete_ids: body.athleteIds || [],
        location: body.location || null,
        notes: body.notes || null,
        color: body.color || null,
        tags: body.tags || null,
        max_participants: body.maxParticipants || null,
        recurrence_pattern: body.recurrencePattern || null,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating calendar event:', eventError);
      return NextResponse.json(
        { error: 'Failed to create event', details: eventError.message },
        { status: 500 }
      );
    }

    // ==============================================================
    // CREATE EVENT PARTICIPANTS (V2.0)
    // ==============================================================
    if (body.athleteIds && Array.isArray(body.athleteIds) && body.athleteIds.length > 0) {
      const participants = body.athleteIds.map((athleteId: string) => ({
        event_id: event.id,
        athlete_id: athleteId,
        status: 'pending', // Default status
      }));

      const { error: participantsError } = await supabase
        .from('event_participants')
        .insert(participants);

      if (participantsError) {
        console.error('Error creating event participants:', participantsError);
        // Don't fail the whole request, just log
        // The event was created successfully with athlete_ids (legacy support)
      } else {}
    }

    // ==============================================================
    // RECURRENCE EXPANSION (V2.0 - FASE 2)
    // ==============================================================
    let instancesCreated = 0;
    
    if (body.recurrencePattern && body.recurrencePattern.frequency !== 'none') {
      try {
        // Generate instances
        const instances = generateInstances(
          startDate,
          endDate,
          body.recurrencePattern as RecurrencePattern,
          365 // Max instances
        );

        if (instances.length > 0) {
          // Convert pattern to RRULE
          const rrule = patternToRRule(body.recurrencePattern as RecurrencePattern);
          
          // Update parent event with RRULE
          await supabase
            .from('calendar_events')
            .update({ recurrence_rule: rrule })
            .eq('id', event.id);
          
          // Create instance events (skip first one as it's the parent)
          const instanceEvents = instances.slice(1).map((instance, index) => ({
            workspace_id: workspaceId,
            title,
            description: body.description || null,
            type,
            status: body.status || 'scheduled',
            start_date: instance.start_date,
            end_date: instance.end_date,
            workout_id: body.workoutId || null,
            plan_id: body.planId || null,
            class_id: body.classId || null,
            coach_id: body.coachId || null,
            athlete_ids: body.athleteIds || [],
            location: body.location || null,
            notes: body.notes || null,
            color: body.color || null,
            tags: body.tags || null,
            max_participants: body.maxParticipants || null,
            recurrence_rule: rrule,
            recurrence_parent_id: event.id, // Link to parent
            metadata: {
              ...body.metadata,
              instance_number: index + 2, // 1-based (parent is 1)
              total_instances: instances.length,
            },
          }));
          
          if (instanceEvents.length > 0) {
            // Batch insert instances
            const { data: createdInstances, error: instancesError } = await supabase
              .from('calendar_events')
              .insert(instanceEvents)
              .select('id');
            
            if (instancesError) {
              console.error('Error creating recurrence instances:', instancesError);
              // Don't fail parent event creation
            } else {
              instancesCreated = createdInstances?.length || 0;

              // Create participants for each instance
              if (body.athleteIds && Array.isArray(body.athleteIds) && body.athleteIds.length > 0) {
                const allInstanceParticipants = createdInstances.flatMap(inst =>
                  body.athleteIds.map((athleteId: string) => ({
                    event_id: inst.id,
                    athlete_id: athleteId,
                    status: 'pending',
                  }))
                );

                await supabase
                  .from('event_participants')
                  .insert(allInstanceParticipants);
              }
            }
          }
        }
      } catch (recurrenceError) {
        console.error('Error processing recurrence:', recurrenceError);
        // Don't fail the request - parent event was created successfully
      }
    }

    // ==============================================================
    // DISPATCH EVENT CREATED
    // ==============================================================
    await dispatchCalendarEvent('created', {
      workspaceId: event.workspace_id,
      eventId: event.id,
      title: event.title,
      startDate: event.start_date,
      athleteIds: event.athlete_ids || [],
      userId: body.coachId,
    }).catch(err => {
      console.error('❌ Error dispatching calendar event:', err);
    });

    const responseMessage = instancesCreated > 0
      ? `Event "${title}" created successfully with ${instancesCreated} recurring instances`
      : `Event "${title}" created successfully`;

    return NextResponse.json({
      success: true,
      event,
      instancesCreated,
      message: responseMessage,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/calendar-events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/calendar-events - Update event
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

    // Prepare update data (convert camelCase to snake_case)
    const allowedFields = [
      'title', 'description', 'type', 'status', 'startDate', 'endDate',
      'workoutId', 'coachId', 'athleteIds', 'location', 'notes',
      'recurrencePattern', 'metadata', 'completedBy', 'completedAt'
    ];

    const filteredData: any = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        filteredData[snakeField] = updateData[field];
      }
    });

    // Validate dates if provided
    if (filteredData.start_date && filteredData.end_date) {
      const start = new Date(filteredData.start_date);
      const end = new Date(filteredData.end_date);

      if (start > end) {
        return NextResponse.json(
          { error: 'startDate must be before endDate' },
          { status: 400 }
        );
      }
    }

    // Update event
    const { data: event, error } = await supabase
      .from('calendar_events')
      .update(filteredData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json(
        { error: 'Failed to update event', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
      message: 'Event updated successfully',
    });

  } catch (error: any) {
    console.error('Unexpected error in PUT /api/calendar-events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/calendar-events - Delete event
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const cancel = searchParams.get('cancel') === 'true'; // Soft delete via status

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (cancel) {
      // Soft delete: mark as cancelled
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      if (error) {
        console.error('Error cancelling event:', error);
        return NextResponse.json(
          { error: 'Failed to cancel event', details: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Event cancelled',
      });
    } else {
      // Hard delete
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json(
          { 
            error: 'Failed to delete event', 
            details: error.message,
            hint: 'Event may be referenced in sessions. Use cancel=true instead.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Event deleted permanently',
      });
    }

  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/calendar-events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}