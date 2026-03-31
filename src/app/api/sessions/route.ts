import { NextRequest, NextResponse } from 'next/server';
import * as kv from '@/supabase/functions/server/kv_store';

/**
 * POST /api/sessions
 * 
 * Creates a new live session when coach starts it.
 * Returns sessionId to be used for snapshot later.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workspaceId,
      calendarEventId,
      workoutId,
      coachId,
      athleteIds,
      startedAt,
      plannedWorkout,
    } = body;

    // Validate required fields
    if (!workspaceId || !calendarEventId || !coachId || !athleteIds) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, calendarEventId, coachId, athleteIds' },
        { status: 400 }
      );
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;

    // Create session record
    const session = {
      id: sessionId,
      workspaceId,
      calendarEventId,
      workoutId: workoutId || null,
      coachId,
      athleteIds,
      status: 'active',
      startedAt: startedAt || new Date().toISOString(),
      plannedWorkout: plannedWorkout || null,
      createdAt: new Date().toISOString(),
    };

    // Save to KV store
    await kv.set(`session:${sessionId}`, session);

    // Index by workspace for queries
    const workspaceSessions = (await kv.get(`workspace:${workspaceId}:sessions`)) || [];
    workspaceSessions.push(sessionId);
    await kv.set(`workspace:${workspaceId}:sessions`, workspaceSessions);

    // Index by calendar event
    await kv.set(`calendar_event:${calendarEventId}:session`, sessionId);

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        status: 'active',
        startedAt: session.startedAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sessions
 * 
 * Lists sessions for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    // Get session IDs for workspace
    const sessionIds = (await kv.get(`workspace:${workspaceId}:sessions`)) || [];

    // Fetch session details
    const sessions = await Promise.all(
      sessionIds.map(async (id: string) => {
        const session = await kv.get(`session:${id}`);
        return session;
      })
    );

    // Filter out nulls and sort by date
    const validSessions = sessions
      .filter(s => s !== null)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return NextResponse.json({
      success: true,
      sessions: validSessions,
      total: validSessions.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
