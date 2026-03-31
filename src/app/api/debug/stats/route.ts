import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = searchParams.get('athleteId') || 'athlete-1';

  const response = {
    athlete_id: athleteId,
    period: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      days: 7
    },
    kpis: {
      readiness_score: 85,
      weekly_load: {
        actual: 450,
        planned: 500,
        percentage: 90,
        trend: 'stable'
      },
      sessions: {
        completed: 5,
        scheduled: 6,
        compliance_rate: 83
      },
      avg_rpe: 6.5,
      last_session: {
        id: 'session-1',
        title: 'Strength Training',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: '18:00',
        relativeTime: 'Há 2 dias'
      },
      next_session: {
        id: 'session-2',
        title: 'Conditioning',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        time: '10:00',
        relativeTime: 'Amanhã'
      },
      active_alerts: 0
    }
  };

  return NextResponse.json(response);
}
