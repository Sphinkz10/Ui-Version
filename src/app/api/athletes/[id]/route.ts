/**
 * Individual Athlete API Endpoint - MASTER PLAN INTEGRATION ✅
 * 
 * GET /api/athletes/[id] - Get single athlete with full details
 * 
 * NO MORE MOCK FALLBACKS - Returns structured errors instead
 * 
 * @author PerformTrack Team
 * @since Master Plan - Step 1.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// TYPES
// ============================================================================
interface AthleteStats {
  totalSessions: number;
  completedThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  avgAttendanceRate: number;
  totalTrainingHours: number;
  personalRecords: number;
  goalsAchieved: number;
}

interface AthleteResponse {
  athlete: any;
  stats: AthleteStats;
  source: 'database' | 'error';
  error?: string;
}

// ============================================================================
// GET /api/athletes/[id] - Get single athlete
// ============================================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const athleteId = params.id;

    if (!athleteId) {
      return NextResponse.json(
        { 
          error: 'Athlete ID is required',
          athlete: null,
          source: 'error'
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch athlete from database
    const { data: athlete, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', athleteId)
      .single();

    // If not found, return 404 with structured error
    if (error || !athlete) {
      return NextResponse.json(
        {
          athlete: null,
          stats: null,
          source: 'error',
          error: 'Athlete not found'
        },
        { status: 404 }
      );
    }

    // Calculate real stats from database
    // TODO: Replace with actual queries
    const stats: AthleteStats = await calculateAthleteStats(supabase, athleteId);

    return NextResponse.json({
      athlete,
      stats,
      source: 'database'
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athletes/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        athlete: null,
        source: 'error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Calculate Athlete Stats
// ============================================================================
async function calculateAthleteStats(
  supabase: any,
  athleteId: string
): Promise<AthleteStats> {
  // TODO: Implement real queries
  // For now, return zeros to avoid mock data
  
  // Query 1: Total sessions
  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', athleteId);

  // Query 2: Sessions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { count: completedThisMonth } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', athleteId)
    .gte('created_at', startOfMonth.toISOString());

  // Query 3: Personal records
  const { count: personalRecords } = await supabase
    .from('personal_records')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', athleteId)
    .eq('status', 'active');

  return {
    totalSessions: totalSessions || 0,
    completedThisMonth: completedThisMonth || 0,
    currentStreak: 0, // TODO: Calculate from sessions
    longestStreak: 0, // TODO: Calculate from sessions
    avgAttendanceRate: 0, // TODO: Calculate from calendar
    totalTrainingHours: 0, // TODO: Sum from sessions
    personalRecords: personalRecords || 0,
    goalsAchieved: 0 // TODO: Calculate from goals table
  };
}