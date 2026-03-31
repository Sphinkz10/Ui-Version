import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/calendar-events/:id - Update event (reschedule, status change, etc)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const { workspaceId, start_date, end_date, ...otherUpdates } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // TODO: Update in real database
    // For now, just return success with updated event
    const updatedEvent = {
      id,
      ...otherUpdates,
      start_date,
      end_date,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      event: updatedEvent,
      message: 'Event updated successfully'
    });
  } catch (error: any) {
    console.error('PATCH /api/calendar-events/:id error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar-events/:id - Delete event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Event deleted successfully'
    });
  } catch (error: any) {
    console.error('DELETE /api/calendar-events/:id error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
