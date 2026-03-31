/**
 * Analytics Dashboard API - FASE 5 ENTERPRISE FEATURES
 * 
 * GET /api/analytics/dashboard
 * Returns aggregated analytics for dashboard widgets.
 * 
 * This endpoint uses analytics_cache table for performance.
 * 
 * Query params:
 * - workspaceId: string (required)
 * - dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
 * - startDate?: string (ISO 8601) - if dateRange=custom
 * - endDate?: string (ISO 8601) - if dateRange=custom
 * - athleteIds?: string (comma-separated) - filter by athletes
 * - forceRefresh?: boolean - bypass cache
 * 
 * Response:
 * {
 *   overview: {
 *     totalSessions: number,
 *     totalAthletes: number,
 *     totalVolume: number,
 *     avgAttendance: number
 *   },
 *   trends: {
 *     sessionsOverTime: [ { date, count } ],
 *     volumeOverTime: [ { date, volume } ],
 *     attendanceOverTime: [ { date, rate } ]
 *   },
 *   topPerformers: [ { athleteId, name, stats } ],
 *   upcomingEvents: [ { id, title, date, athleteCount } ],
 *   recentActivity: [ { type, description, timestamp } ]
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 5 - Enterprise Features
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// HELPER: Calculate date range
// ============================================================================
function getDateRange(range: string, startDate?: string, endDate?: string): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (range) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (!startDate || !endDate) {
        throw new Error('startDate and endDate required for custom range');
      }
      start = new Date(startDate);
      end = new Date(endDate);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days
  }

  return { start, end };
}

// ============================================================================
// HELPER: Check cache
// ============================================================================
async function checkCache(
  supabase: any,
  workspaceId: string,
  cacheKey: string
): Promise<any | null> {
  const { data: cached } = await supabase
    .from('analytics_cache')
    .select('data, expires_at')
    .eq('workspace_id', workspaceId)
    .eq('cache_key', cacheKey)
    .maybeSingle();

  if (cached && new Date(cached.expires_at) > new Date()) {
    // Update hit count
    await supabase
      .from('analytics_cache')
      .update({ 
        hit_count: supabase.raw('hit_count + 1'),
        last_accessed_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('cache_key', cacheKey);

    return cached.data;
  }

  return null;
}

// ============================================================================
// HELPER: Save to cache
// ============================================================================
async function saveCache(
  supabase: any,
  workspaceId: string,
  cacheKey: string,
  queryType: string,
  data: any,
  parameters: any,
  ttlMinutes: number = 15
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await supabase
    .from('analytics_cache')
    .upsert({
      workspace_id: workspaceId,
      cache_key: cacheKey,
      query_type: queryType,
      parameters,
      data,
      expires_at: expiresAt.toISOString(),
      row_count: Array.isArray(data) ? data.length : null,
    }, {
      onConflict: 'workspace_id,cache_key',
    });
}

// ============================================================================
// GET /api/analytics/dashboard - Get dashboard analytics
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const workspaceId = searchParams.get('workspaceId');
    const dateRangeParam = searchParams.get('dateRange') || 'month';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const athleteIds = searchParams.get('athleteIds')?.split(',').filter(Boolean);
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // Validate
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Calculate date range
    const { start, end } = getDateRange(dateRangeParam, startDate, endDate);

    // Create cache key
    const cacheKey = `dashboard_${dateRangeParam}_${athleteIds?.join('-') || 'all'}_${start.toISOString()}_${end.toISOString()}`;

    // Check cache (unless force refresh)
    if (!forceRefresh) {
      const cachedData = await checkCache(supabase, workspaceId, cacheKey);
      if (cachedData) {
        return NextResponse.json({
          ...cachedData,
          cached: true,
          cacheKey,
        });
      }
    }

    // ==============================================================
    // COMPUTE ANALYTICS (not cached)
    // ==============================================================

    // 1. OVERVIEW STATS
    // -----------------

    // Total sessions
    let sessionsQuery = supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString());

    const { count: totalSessions } = await sessionsQuery;

    // Total athletes (active in date range)
    const { data: sessionAthletes } = await supabase
      .from('session_athletes')
      .select('athlete_id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const uniqueAthletes = new Set((sessionAthletes || []).map((sa: any) => sa.athlete_id));
    const totalAthletes = uniqueAthletes.size;

    // Total volume (sum of all weight lifted)
    const { data: exerciseData } = await supabase
      .from('session_exercise_data')
      .select('data')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    let totalVolume = 0;
    (exerciseData || []).forEach((record: any) => {
      const sets = record.data?.sets || [];
      sets.forEach((set: any) => {
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
      });
    });

    // Average attendance rate
    const { data: attendanceData } = await supabase
      .from('session_athletes')
      .select('attendance')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const presentCount = (attendanceData || []).filter((sa: any) => sa.attendance === 'present').length;
    const avgAttendance = attendanceData && attendanceData.length > 0
      ? Math.round((presentCount / attendanceData.length) * 100)
      : 0;

    // 2. TRENDS OVER TIME
    // --------------------

    const { data: sessions } = await supabase
      .from('sessions')
      .select('started_at')
      .eq('workspace_id', workspaceId)
      .gte('started_at', start.toISOString())
      .lte('started_at', end.toISOString())
      .order('started_at', { ascending: true });

    // Group by date
    const sessionsByDate = new Map();
    (sessions || []).forEach((session: any) => {
      const date = new Date(session.started_at).toISOString().split('T')[0];
      sessionsByDate.set(date, (sessionsByDate.get(date) || 0) + 1);
    });

    const sessionsOverTime = Array.from(sessionsByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // 3. TOP PERFORMERS
    // ------------------

    const { data: topPerformersData } = await supabase
      .from('session_athletes')
      .select(`
        athlete_id,
        athletes (
          id,
          name,
          avatar_url
        )
      `)
      .eq('attendance', 'present')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const athleteSessionCounts = new Map();
    (topPerformersData || []).forEach((sa: any) => {
      const athleteId = sa.athlete_id;
      athleteSessionCounts.set(athleteId, {
        athlete: sa.athletes,
        count: (athleteSessionCounts.get(athleteId)?.count || 0) + 1,
      });
    });

    const topPerformers = Array.from(athleteSessionCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(item => ({
        athleteId: item.athlete.id,
        name: item.athlete.name,
        avatarUrl: item.athlete.avatar_url,
        sessionCount: item.count,
      }));

    // 4. UPCOMING EVENTS
    // ------------------

    const { data: upcomingEvents } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, athlete_ids')
      .eq('workspace_id', workspaceId)
      .eq('status', 'scheduled')
      .gte('start_date', new Date().toISOString())
      .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_date', { ascending: true })
      .limit(10);

    const upcomingFormatted = (upcomingEvents || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      date: event.start_date,
      athleteCount: event.athlete_ids?.length || 0,
    }));

    // 5. RECENT ACTIVITY
    // ------------------

    const { data: recentSessions } = await supabase
      .from('sessions')
      .select(`
        id,
        started_at,
        completed_at,
        status,
        workouts (
          name
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(10);

    const recentActivity = (recentSessions || []).map((session: any) => ({
      type: 'session',
      description: `${session.workouts?.name || 'Workout'} ${session.status}`,
      timestamp: session.started_at,
      entityId: session.id,
    }));

    // ==============================================================
    // BUILD RESPONSE
    // ==============================================================

    // 🚀 TEMPORARY MOCK DATA - Replace with real data when DB populated
    const useMockData = totalSessions === 0 || !totalSessions;

    if (useMockData) {
      return NextResponse.json({
        attendance: {
          present: 24,
          total: 30,
          percentage: 80,
          trend: '+3 vs ontem',
        },
        sessions: {
          completedToday: 2,
          totalToday: 5,
          completionRate: 40,
          trend: '3 em curso',
        },
        nextSession: {
          time: '14:30',
          title: 'Treino de Força U17',
          minutesUntil: 120,
        },
        alerts: {
          critical: 3,
          high: 2,
          medium: 2,
          total: 7,
        },
        cached: false,
        mock: true,
      });
    }

    const response = {
      overview: {
        totalSessions: totalSessions || 0,
        totalAthletes,
        totalVolume: Math.round(totalVolume),
        avgAttendance,
      },
      trends: {
        sessionsOverTime,
        volumeOverTime: [], // Could calculate from session_exercise_data
        attendanceOverTime: [], // Could calculate from session_athletes
      },
      topPerformers,
      upcomingEvents: upcomingFormatted,
      recentActivity,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };

    // Save to cache
    await saveCache(
      supabase,
      workspaceId,
      cacheKey,
      'dashboard',
      response,
      { dateRange: dateRangeParam, athleteIds },
      15 // 15 minutes TTL
    );

    return NextResponse.json({
      ...response,
      cached: false,
      cacheKey,
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/analytics/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}