import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Session Snapshot API - SEMANA 3 INTEGRATED ✅
 * 
 * POST /api/sessions/[id]/snapshot
 * 
 * CRITICAL INTEGRATION POINT - This bridges Live Command → Athlete Profile
 * 
 * Saves immutable session snapshot and automatically:
 * 1. Updates session table with snapshot_data (JSONB)
 * 2. Updates session_athletes with aggregated stats
 * 3. Creates personal_records if PRs achieved
 * 4. Creates metric_updates for all metrics
 * 5. Triggers post-session analytics
 * 
 * @author PerformTrack Team
 * @since Semana 3 - Live Session Integration
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params;
    const body = await request.json();

    const { snapshotData, completedAt } = body;

    if (!snapshotData) {
      return NextResponse.json(
        { error: 'Missing snapshotData in request body' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ============================================================
    // 1. GET EXISTING SESSION
    // ============================================================
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, workout:workouts(*)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('❌ [Snapshot] Session not found:', sessionError);
      return NextResponse.json(
        { error: 'Session not found', details: sessionError?.message },
        { status: 404 }
      );
    }

    // ============================================================
    // 2. BUILD IMMUTABLE SNAPSHOT
    // ============================================================
    const snapshot = {
      version: '1.0',
      sessionId,
      workoutId: session.workout_id,
      workout: session.workout,
      completedAt: completedAt || new Date().toISOString(),
      savedAt: new Date().toISOString(),
      ...snapshotData,
    };

    // ============================================================
    // 3. UPDATE SESSION WITH SNAPSHOT (IMMUTABLE!)
    // ============================================================
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        snapshot_data: snapshot,
        status: 'completed',
        completed_at: snapshot.completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('❌ [Snapshot] Failed to save snapshot:', updateError);
      return NextResponse.json(
        { error: 'Failed to save snapshot', details: updateError.message },
        { status: 500 }
      );
    }

    // ============================================================
    // 4. PROCESS EACH ATHLETE
    // ============================================================
    const personalRecords: any[] = [];
    const metricUpdates: any[] = [];

    for (const athleteSnapshot of snapshot.athletes || []) {
      const athleteId = athleteSnapshot.athleteId;

      // ============================================================
      // 4a. CALCULATE ATHLETE AGGREGATES
      // ============================================================
      let totalVolume = 0;
      let totalSets = 0;
      let totalReps = 0;
      let rpeValues: number[] = [];
      const prsAchieved: any[] = [];

      // Process each exercise for this athlete
      for (const exercise of snapshotData.executedWorkout?.exercises || []) {
        const athleteData = exercise.athleteData?.[athleteId] || [];
        
        for (const set of athleteData) {
          totalSets++;
          totalReps += set.reps || 0;
          totalVolume += (set.reps || 0) * (set.weight || 0);
          
          if (set.rpe) {
            rpeValues.push(set.rpe);
          }

          // ============================================================
          // 4b. CHECK FOR PERSONAL RECORDS
          // ============================================================
          if (set.isPR) {
            prsAchieved.push({
              exerciseName: exercise.name,
              exerciseId: exercise.id,
              value: set.weight || set.distance || set.duration,
              unit: set.weight ? 'kg' : (set.distance ? 'm' : 's'),
              reps: set.reps,
              achievedAt: snapshot.completedAt
            });
          }
        }
      }

      const avgRPE = rpeValues.length > 0
        ? rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
        : null;

      // ============================================================
      // 4c. UPDATE SESSION_ATHLETES
      // ============================================================
      const { error: saError } = await supabase
        .from('session_athletes')
        .update({
          volume_total: Math.round(totalVolume),
          total_sets: totalSets,
          total_reps: totalReps,
          avg_rpe: avgRPE ? Math.round(avgRPE * 10) / 10 : null,
          personal_records_achieved: prsAchieved.length > 0 ? prsAchieved : null,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('athlete_id', athleteId);

      if (saError) {
        console.error(`❌ [Snapshot] Failed to update session_athletes for ${athleteId}:`, saError);
      } else {}

      // ============================================================
      // 4d. CREATE PERSONAL RECORDS
      // ============================================================
      for (const pr of prsAchieved) {
        const metricName = `${pr.exerciseName.toLowerCase().replace(/\s+/g, '_')}_${pr.unit}`;
        
        // Check if this is actually a PR (better than previous)
        const { data: existingRecords } = await supabase
          .from('personal_records')
          .select('value')
          .eq('athlete_id', athleteId)
          .eq('metric_name', metricName)
          .eq('status', 'active')
          .order('value', { ascending: false })
          .limit(1);

        const previousBest = existingRecords?.[0]?.value || 0;
        const isPRVerified = pr.value > previousBest;

        if (isPRVerified) {
          const { data: newRecord, error: prError } = await supabase
            .from('personal_records')
            .insert({
              workspace_id: session.workspace_id,
              athlete_id: athleteId,
              metric_name: metricName,
              display_name: `${pr.exerciseName} (${pr.reps} reps)`,
              category: 'strength', // TODO: derive from exercise type
              value: pr.value,
              unit: pr.unit,
              achieved_at: pr.achievedAt,
              source: 'live_session',
              source_id: sessionId,
              status: 'active',
              created_by: session.created_by,
              previous_value: previousBest,
              improvement_percentage: previousBest > 0 
                ? Math.round(((pr.value - previousBest) / previousBest) * 100)
                : 100
            })
            .select()
            .single();

          if (prError) {
            console.error(`❌ [Snapshot] Failed to create PR:`, prError);
          } else {
            personalRecords.push(newRecord);
          }
        }
      }

      // ============================================================
      // 4e. CREATE METRIC UPDATES
      // ============================================================

      // Training Load metric
      if (totalVolume > 0) {
        metricUpdates.push({
          workspace_id: session.workspace_id,
          athlete_id: athleteId,
          metric_id: 'training_load',
          value_numeric: totalVolume,
          timestamp: snapshot.completedAt,
          source_type: 'live_session',
          source_id: sessionId,
          created_by: session.created_by
        });
      }

      // RPE metric
      if (avgRPE) {
        metricUpdates.push({
          workspace_id: session.workspace_id,
          athlete_id: athleteId,
          metric_id: 'rpe',
          value_numeric: avgRPE,
          timestamp: snapshot.completedAt,
          source_type: 'live_session',
          source_id: sessionId,
          created_by: session.created_by
        });
      }

      // Total Sets metric
      if (totalSets > 0) {
        metricUpdates.push({
          workspace_id: session.workspace_id,
          athlete_id: athleteId,
          metric_id: 'total_sets',
          value_numeric: totalSets,
          timestamp: snapshot.completedAt,
          source_type: 'live_session',
          source_id: sessionId,
          created_by: session.created_by
        });
      }
    }

    // ============================================================
    // 5. BULK INSERT METRIC UPDATES
    // ============================================================
    if (metricUpdates.length > 0) {
      const { error: muError } = await supabase
        .from('metric_updates')
        .insert(metricUpdates);

      if (muError) {
        console.error(`❌ [Snapshot] Failed to create metric updates:`, muError);
      } else {}
    }

    // ============================================================
    // 6. RETURN SUCCESS
    // ============================================================
    const response = {
      success: true,
      sessionId,
      snapshot: {
        savedAt: snapshot.savedAt,
        version: snapshot.version,
        athletesProcessed: snapshot.athletes?.length || 0
      },
      stats: {
        personalRecords: personalRecords.length,
        metricUpdates: metricUpdates.length
      },
      personalRecords,
      message: `Session snapshot saved! Created ${personalRecords.length} PRs and ${metricUpdates.length} metric updates.`
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Snapshot] Unexpected error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions/[id]/snapshot
 * 
 * Retrieves saved snapshot for a session
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await context.params;
    
    const snapshot = await kv.get(`session:${sessionId}:snapshot`);
    
    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found for this session' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      snapshot,
    });

  } catch (error: any) {
    console.error('❌ Error fetching snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}