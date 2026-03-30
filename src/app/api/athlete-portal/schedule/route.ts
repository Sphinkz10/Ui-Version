/**
 * Athlete Portal - My Schedule API - FASE 4 ATHLETE PORTAL
 * 
 * GET /api/athlete-portal/schedule
 * Returns the authenticated athlete's schedule.
 * 
 * Query params:
 * - startDate?: string (ISO 8601) - default: today
 * - endDate?: string (ISO 8601) - default: +30 days
 * - status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   events: [
 *     {
 *       id: string,
 *       title: string,
 *       startDate: string,
 *       endDate: string,
 *       type: string,
 *       status: string,
 *       workout: { name, type, difficulty },
 *       location: string,
 *       hasSession: boolean
 *     }
 *   ],
 *   stats: {
 *     total: number,
 *     upcoming: number,
 *     completed: number,
 *     thisWeek: number
 *   }
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 4 - Athlete Portal Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import jwt from 'jsonwebtoken';

// Helper to extract athlete from token
async function getAthleteFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as jwt.JwtPayload;
    return { athleteId: decoded.athleteId, workspaceId: decoded.workspaceId };
  } catch {
    return null;
  }
}

// ============================================================================
// GET /api/athlete-portal/schedule - Get my schedule
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const auth = await getAthleteFromToken(request);

    if (!auth || !auth.athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }
    const { athleteId, workspaceId } = auth;

    const { searchParams } = new URL(request.url);
    
    // Get query params with defaults
    const startDate = searchParams.get('startDate') || new Date().toISOString();
    const endDate = searchParams.get('endDate') || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days
    const status = searchParams.get('status');

    const supabase = await createClient();

    // ==============================================================
    // STEP 1: Verify athlete belongs to workspace
    // ==============================================================
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('workspace_id', workspaceId) // SEC-002 Ensure workspace isolation
      .single();

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found or unauthorized' },
        { status: 404 }
      );
    }

    // ==============================================================
    // Use get_athlete_schedule SQL function
    // ==============================================================
    const { data: events, error: eventsError } = await supabase
      .rpc('get_athlete_schedule', {
        p_athlete_id: athleteId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (eventsError) {
      console.error('Error fetching schedule:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch schedule', details: eventsError.message },
        { status: 500 }
      );
    }

    // Filter by status if provided
    let filteredEvents = events || [];
    
    if (status) {
      filteredEvents = filteredEvents.filter((e: any) => e.status === status);
    }

    // ==============================================================
    // Enrich events with additional data
    // ==============================================================
    const eventIds = filteredEvents.map((e: any) => e.event_id);
    
    // Get full event details including workout
    const { data: fullEvents } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        type,
        status,
        location,
        notes,
        workout_id,
        workouts (
          id,
          name,
          type,
          difficulty,
          estimated_duration_minutes
        )
      `)
      .in('id', eventIds);

    // Check which events have sessions
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('calendar_event_id, id, status, completed_at')
      .in('calendar_event_id', eventIds);

    const sessionsMap = new Map();
    (sessionsData || []).forEach((s: any) => {
      sessionsMap.set(s.calendar_event_id, s);
    });

    // Merge data
    const enrichedEvents = (fullEvents || []).map((event: any) => {
      const session = sessionsMap.get(event.id);
      
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.start_date,
        endDate: event.end_date,
        type: event.type,
        status: event.status,
        location: event.location,
        notes: event.notes,
        workout: event.workouts ? {
          id: event.workouts.id,
          name: event.workouts.name,
          type: event.workouts.type,
          difficulty: event.workouts.difficulty,
          estimatedDuration: event.workouts.estimated_duration_minutes,
        } : null,
        hasSession: !!session,
        sessionId: session?.id,
        sessionStatus: session?.status,
        sessionCompletedAt: session?.completed_at,
      };
    });

    // Sort by start date
    enrichedEvents.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // ==============================================================
    // Calculate stats
    // ==============================================================
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: enrichedEvents.length,
      upcoming: enrichedEvents.filter(e => 
        new Date(e.startDate) > now && e.status === 'scheduled'
      ).length,
      completed: enrichedEvents.filter(e => 
        e.status === 'completed'
      ).length,
      cancelled: enrichedEvents.filter(e => 
        e.status === 'cancelled'
      ).length,
      thisWeek: enrichedEvents.filter(e => {
        const eventDate = new Date(e.startDate);
        return eventDate > now && eventDate < weekFromNow && e.status === 'scheduled';
      }).length,
    };

    // ==============================================================
    // RETURN SCHEDULE
    // ==============================================================
    return NextResponse.json({
      events: enrichedEvents,
      stats,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athlete-portal/schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
