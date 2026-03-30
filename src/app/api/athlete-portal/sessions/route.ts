/**
 * Athlete Portal - My Sessions API - FASE 4 ATHLETE PORTAL
 * 
 * GET /api/athlete-portal/sessions
 * Returns the authenticated athlete's session history.
 * 
 * Query params:
 * - limit?: number (default: 20)
 * - offset?: number (default: 0)
 * - workoutType?: string
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   sessions: [
 *     {
 *       id: string,
 *       workoutName: string,
 *       date: string,
 *       attendance: string,
 *       duration: number,
 *       myStats: {
 *         volume: number,
 *         reps: number,
 *         sets: number,
 *         avgRPE: number
 *       },
 *       exercises: [...]
 *     }
 *   ],
 *   pagination: {
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     hasMore: boolean
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
// GET /api/athlete-portal/sessions - Get my session history
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
    
    // Get query params
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const workoutType = searchParams.get('workoutType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
    // STEP 2: Get session IDs where athlete participated
    // ==============================================================
    let sessionQuery = supabase
      .from('session_athletes')
      .select('session_id, attendance, performance_notes')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false });

    const { data: sessionAthletes, error: sessionAthletesError } = await sessionQuery;

    if (sessionAthletesError) {
      console.error('Error fetching session_athletes:', sessionAthletesError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionAthletesError.message },
        { status: 500 }
      );
    }

    if (!sessionAthletes || sessionAthletes.length === 0) {
      return NextResponse.json({
        sessions: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
      });
    }

    const sessionIds = sessionAthletes.map((sa: any) => sa.session_id);

    // ==============================================================
    // STEP 2: Get full session details
    // ==============================================================
    let sessionsQuery = supabase
      .from('sessions')
      .select(`
        id,
        started_at,
        completed_at,
        paused_duration_seconds,
        status,
        workout_id,
        workouts (
          id,
          name,
          type,
          difficulty
        )
      `)
      .in('id', sessionIds)
      .order('started_at', { ascending: false });

    // Apply filters
    if (startDate) {
      sessionsQuery = sessionsQuery.gte('started_at', startDate);
    }

    if (endDate) {
      sessionsQuery = sessionsQuery.lte('started_at', endDate);
    }

    // Get total count first
    const { count: totalCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .in('id', sessionIds);

    // Apply pagination
    sessionsQuery = sessionsQuery.range(offset, offset + limit - 1);

    const { data: sessions, error: sessionsError } = await sessionsQuery;

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions', details: sessionsError.message },
        { status: 500 }
      );
    }

    // Filter by workout type if provided
    let filteredSessions = sessions || [];
    if (workoutType) {
      filteredSessions = filteredSessions.filter(
        (s: any) => s.workouts?.type === workoutType
      );
    }

    // ==============================================================
    // STEP 3: Get exercise data for each session
    // ==============================================================
    const enrichedSessions = await Promise.all(
      filteredSessions.map(async (session: any) => {
        // Get my exercise data for this session
        const { data: exerciseData } = await supabase
          .from('session_exercise_data')
          .select(`
            id,
            exercise_id,
            data,
            exercises (
              id,
              name,
              category
            )
          `)
          .eq('session_id', session.id)
          .eq('athlete_id', athleteId);

        // Calculate stats from exercise data
        let totalVolume = 0;
        let totalReps = 0;
        let totalSets = 0;
        let rpeSum = 0;
        let rpeCount = 0;

        const exercises = (exerciseData || []).map((ed: any) => {
          const sets = ed.data?.sets || [];
          
          sets.forEach((set: any) => {
            totalSets++;
            if (set.reps) totalReps += set.reps;
            if (set.weight && set.reps) {
              totalVolume += set.weight * set.reps;
            }
            if (set.rpe) {
              rpeSum += set.rpe;
              rpeCount++;
            }
          });

          return {
            id: ed.id,
            exerciseId: ed.exercise_id,
            exerciseName: ed.exercises?.name,
            exerciseCategory: ed.exercises?.category,
            sets: sets.length,
            data: ed.data,
          };
        });

        // Get attendance info
        const attendance = sessionAthletes.find(
          (sa: any) => sa.session_id === session.id
        )?.attendance;

        // Calculate duration
        let duration = 0;
        if (session.started_at && session.completed_at) {
          const start = new Date(session.started_at).getTime();
          const end = new Date(session.completed_at).getTime();
          duration = Math.round((end - start) / 1000 / 60); // minutes
          
          // Subtract paused time
          if (session.paused_duration_seconds) {
            duration -= Math.round(session.paused_duration_seconds / 60);
          }
        }

        return {
          id: session.id,
          workoutName: session.workouts?.name || 'Unknown Workout',
          workoutType: session.workouts?.type,
          workoutDifficulty: session.workouts?.difficulty,
          date: session.started_at,
          completedAt: session.completed_at,
          status: session.status,
          attendance,
          duration, // minutes
          myStats: {
            volume: Math.round(totalVolume),
            reps: totalReps,
            sets: totalSets,
            avgRPE: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
          },
          exercises,
        };
      })
    );

    // ==============================================================
    // RETURN SESSION HISTORY
    // ==============================================================
    return NextResponse.json({
      sessions: enrichedSessions,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: offset + limit < (totalCount || 0),
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athlete-portal/sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/athlete-portal/sessions/[id] - Get single session detail
// ============================================================================
// This would go in /api/athlete-portal/sessions/[id]/route.ts
// Skipping for now to keep focus on main endpoints
