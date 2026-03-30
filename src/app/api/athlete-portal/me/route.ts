/**
 * Athlete Portal - My Profile API - FASE 4 ATHLETE PORTAL
 * 
 * GET /api/athlete-portal/me
 * Returns the authenticated athlete's full profile with stats.
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   athlete: {
 *     id: string,
 *     name: string,
 *     email: string,
 *     ...
 *   },
 *   stats: {
 *     totalSessions: number,
 *     totalVolume: number,
 *     personalRecords: number,
 *     activeForms: number
 *   },
 *   recentActivity: [...]
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
// GET /api/athlete-portal/me - Get my profile
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

    const supabase = await createClient();

    // ==============================================================
    // STEP 1: Get athlete profile
    // ==============================================================
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select(`
        id,
        name,
        email,
        date_of_birth,
        avatar_url,
        metadata,
        workspace_id,
        created_at
      `)
      .eq('id', athleteId)
      .eq('workspace_id', workspaceId) // SEC-002 explicitly ensure workspace isolation
      .eq('is_active', true)
      .single();

    if (athleteError || !athlete) {
      return NextResponse.json(
        { error: 'Athlete not found or unauthorized for workspace' },
        { status: 404 }
      );
    }

    // ==============================================================
    // STEP 2: Get workspace
    // ==============================================================
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, settings')
      .eq('id', athlete.workspace_id)
      .single();

    // ==============================================================
    // STEP 3: Calculate stats
    // ==============================================================

    // Total sessions participated
    const { count: totalSessions } = await supabase
      .from('session_athletes')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('attendance', 'present');

    // Total personal records
    const { count: personalRecords } = await supabase
      .from('personal_records')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('is_current', true);

    // Active forms (not yet submitted)
    const { count: activeForms } = await supabase
      .from('forms')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', athlete.workspace_id)
      .eq('is_active', true)
      .eq('status', 'active');

    // Total volume (sum of all weight lifted)
    const { data: volumeData } = await supabase
      .from('session_exercise_data')
      .select('data')
      .eq('athlete_id', athleteId);

    let totalVolume = 0;
    if (volumeData) {
      volumeData.forEach((record: any) => {
        const sets = record.data?.sets || [];
        sets.forEach((set: any) => {
          if (set.weight && set.reps) {
            totalVolume += set.weight * set.reps;
          }
        });
      });
    }

    // ==============================================================
    // STEP 4: Get recent activity (last 5 sessions)
    // ==============================================================
    const { data: recentSessions } = await supabase
      .from('session_athletes')
      .select(`
        session_id,
        attendance,
        sessions (
          id,
          started_at,
          completed_at,
          workout_id,
          workouts (
            name,
            type
          )
        )
      `)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(5);

    // ==============================================================
    // STEP 5: Get upcoming events (next 7 days)
    // ==============================================================
    const { data: upcomingEvents } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, end_date, type, workout_id')
      .contains('athlete_ids', [athleteId])
      .eq('status', 'scheduled')
      .gte('start_date', new Date().toISOString())
      .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_date', { ascending: true })
      .limit(10);

    // ==============================================================
    // STEP 6: Get latest metrics
    // ==============================================================
    const { data: latestMetrics } = await supabase
      .from('metric_updates')
      .select(`
        id,
        metric_id,
        value,
        timestamp,
        metrics (
          id,
          name,
          unit,
          type
        )
      `)
      .eq('athlete_id', athleteId)
      .order('timestamp', { ascending: false })
      .limit(10);

    // ==============================================================
    // RETURN FULL PROFILE
    // ==============================================================
    return NextResponse.json({
      athlete: {
        id: athlete.id,
        name: athlete.name,
        email: athlete.email,
        dateOfBirth: athlete.date_of_birth,
        avatarUrl: athlete.avatar_url,
        metadata: athlete.metadata,
        memberSince: athlete.created_at,
      },
      workspace: workspace ? {
        id: workspace.id,
        name: workspace.name,
      } : null,
      stats: {
        totalSessions: totalSessions || 0,
        totalVolume: Math.round(totalVolume),
        personalRecords: personalRecords || 0,
        activeForms: activeForms || 0,
      },
      recentActivity: (recentSessions || []).map((sa: any) => ({
        sessionId: sa.session_id,
        attendance: sa.attendance,
        date: sa.sessions?.started_at,
        workoutName: sa.sessions?.workouts?.name,
        workoutType: sa.sessions?.workouts?.type,
      })),
      upcomingEvents: (upcomingEvents || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        startDate: event.start_date,
        endDate: event.end_date,
        type: event.type,
      })),
      latestMetrics: (latestMetrics || []).map((mu: any) => ({
        id: mu.id,
        metricId: mu.metric_id,
        metricName: mu.metrics?.name,
        metricUnit: mu.metrics?.unit,
        value: mu.value,
        timestamp: mu.timestamp,
      })),
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athlete-portal/me:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/athlete-portal/me - Update my profile
// ============================================================================
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAthleteFromToken(request);

    if (!auth || !auth.athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const { athleteId, workspaceId } = auth;

    const body = await request.json();
    const supabase = await createClient();

    // Allow athletes to update limited fields
    const allowedFields = ['avatar_url', 'metadata'];
    const updateData: any = {};

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[snakeField] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: athlete, error } = await supabase
      .from('athletes')
      .update(updateData)
      .eq('id', athleteId)
      .eq('workspace_id', workspaceId) // SEC-002 Ensure workspace isolation
      .select()
      .single();

    if (error) {
      console.error('Error updating athlete:', error);
      return NextResponse.json(
        { error: 'Failed to update profile', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      athlete,
      message: 'Profile updated successfully',
    });

  } catch (error: any) {
    console.error('Unexpected error in PUT /api/athlete-portal/me:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
