import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const athleteId = params.id;

    const supabase = await createClient();

    // ============================================================
    // 1. CALCULATE DATE RANGE (Last 7 days)
    // ============================================================
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const periodStart = weekAgo.toISOString();
    const periodEnd = now.toISOString();

    // ============================================================
    // 2. FETCH ATHLETE METRICS (for readiness calculation)
    // ============================================================
    const { data: metrics } = await supabase
      .from('metric_updates')
      .select(`
        metric_id,
        value_numeric,
        timestamp,
        metrics!inner (
          name,
          category,
          type
        )
      `)
      .eq('athlete_id', athleteId)
      .gte('timestamp', periodStart)
      .lte('timestamp', periodEnd)
      .order('timestamp', { ascending: false });

    // Calculate readiness score (average of key biological metrics)
    const readinessMetrics = ['hrv', 'sleep_quality', 'readiness', 'recovery'];
    const relevantMetrics = (metrics || []).filter((m: any) => 
      readinessMetrics.some(rm => m.metrics.name?.toLowerCase().includes(rm))
    );

    let readiness_score = 75; // Default
    if (relevantMetrics.length > 0) {
      const avgValue = relevantMetrics.reduce((sum: number, m: any) => sum + (m.value_numeric || 0), 0) / relevantMetrics.length;
      readiness_score = Math.min(100, Math.max(0, avgValue));
    }

    // ============================================================
    // 3. FETCH SESSIONS (for load and compliance)
    // ============================================================
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        scheduled_date,
        start_time,
        status,
        session_athletes!inner (
          athlete_id,
          volume_total,
          avg_rpe
        )
      `)
      .eq('session_athletes.athlete_id', athleteId)
      .gte('scheduled_date', weekAgo.toISOString().split('T')[0])
      .lte('scheduled_date', now.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: false });

    // Calculate weekly load (sum of volume from completed sessions)
    const completedSessions = (sessions || []).filter((s: any) => s.status === 'completed');
    const weekly_load_actual = completedSessions.reduce((sum: number, s: any) => {
      return sum + (s.session_athletes[0]?.volume_total || 0);
    }, 0);

    // Calculate average RPE
    const sessionsWithRPE = completedSessions.filter((s: any) => s.session_athletes[0]?.avg_rpe);
    const avg_rpe = sessionsWithRPE.length > 0
      ? sessionsWithRPE.reduce((sum: number, s: any) => sum + (s.session_athletes[0]?.avg_rpe || 0), 0) / sessionsWithRPE.length
      : 0;

    // ============================================================
    // 4. FETCH SCHEDULED SESSIONS (for compliance)
    // ============================================================
    const { data: scheduledSessions } = await supabase
      .from('calendar_events')
      .select('id, status')
      .eq('athlete_id', athleteId)
      .eq('event_type', 'training')
      .gte('start_date', weekAgo.toISOString().split('T')[0])
      .lte('start_date', now.toISOString().split('T')[0]);

    const scheduled = scheduledSessions?.length || 0;
    const completed = completedSessions.length;
    const compliance_rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    // Calculate planned load (rough estimate: scheduled sessions × average volume)
    const avgVolumePerSession = completedSessions.length > 0
      ? weekly_load_actual / completedSessions.length
      : 500; // Default estimate
    const weekly_load_planned = Math.round(scheduled * avgVolumePerSession);
    const loadPercentage = weekly_load_planned > 0 
      ? Math.round((weekly_load_actual / weekly_load_planned) * 100)
      : 0;

    // Determine load trend
    let loadTrend: 'up' | 'down' | 'stable' = 'stable';
    if (loadPercentage > 110) loadTrend = 'up';
    else if (loadPercentage < 90) loadTrend = 'down';

    // ============================================================
    // 5. GET LAST AND NEXT SESSION
    // ============================================================
    const lastSession = completedSessions[0] || null;
    const lastSessionInfo = lastSession ? {
      id: lastSession.id,
      title: lastSession.title || 'Treino',
      date: lastSession.scheduled_date,
      time: lastSession.start_time || '00:00',
      relativeTime: getRelativeTime(lastSession.scheduled_date)
    } : null;

    // Get next scheduled session (future)
    const { data: futureSessions } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        scheduled_date,
        start_time,
        status,
        session_athletes!inner (
          athlete_id
        )
      `)
      .eq('session_athletes.athlete_id', athleteId)
      .gte('scheduled_date', now.toISOString().split('T')[0])
      .eq('status', 'scheduled')
      .order('scheduled_date', { ascending: true })
      .limit(1);

    const nextSession = futureSessions?.[0] || null;
    const nextSessionInfo = nextSession ? {
      id: nextSession.id,
      title: nextSession.title || 'Treino',
      date: nextSession.scheduled_date,
      time: nextSession.start_time || '00:00',
      relativeTime: getRelativeTime(nextSession.scheduled_date, true)
    } : null;

    // ============================================================
    // 6. COUNT ACTIVE ALERTS
    // ============================================================
    const { data: alerts } = await supabase
      .from('decisions')
      .select('id', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('status', 'pending')
      .gte('priority', 100); // Only high priority alerts

    const active_alerts = alerts || 0;

    // ============================================================
    // 7. BUILD RESPONSE
    // ============================================================
    const response = {
      athlete_id: athleteId,
      period: {
        start: periodStart,
        end: periodEnd,
        days: 7
      },
      kpis: {
        readiness_score: Math.round(readiness_score),
        weekly_load: {
          actual: Math.round(weekly_load_actual),
          planned: weekly_load_planned,
          percentage: loadPercentage,
          trend: loadTrend
        },
        sessions: {
          completed,
          scheduled,
          compliance_rate
        },
        avg_rpe: Math.round(avg_rpe * 10) / 10, // Round to 1 decimal
        last_session: lastSessionInfo,
        next_session: nextSessionInfo,
        active_alerts
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ [Weekly Stats] Error:', error);
    
    // Return fallback with zeros on error
    const params = await context.params;
    return NextResponse.json(
      {
        athlete_id: params.id,
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
          days: 7
        },
        kpis: {
          readiness_score: 0,
          weekly_load: {
            actual: 0,
            planned: 0,
            percentage: 0,
            trend: 'stable'
          },
          sessions: {
            completed: 0,
            scheduled: 0,
            compliance_rate: 0
          },
          avg_rpe: 0,
          last_session: null,
          next_session: null,
          active_alerts: 0
        }
      },
      { status: 200 } // Still return 200 to avoid breaking UI
    );
  }
}

// ============================================================
// HELPER: Calculate relative time
// ============================================================
function getRelativeTime(dateStr: string, isFuture = false): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = isFuture ? date.getTime() - now.getTime() : now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (isFuture) {
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays < 7) return `Em ${diffDays} dias`;
    return `Em ${Math.floor(diffDays / 7)} semana(s)`;
  } else {
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return `Há ${Math.floor(diffDays / 7)} semana(s)`;
  }
}