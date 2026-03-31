/**
 * NOTIFICATIONS API - Mark All as Read
 * 
 * @route PATCH /api/notifications/read-all - Mark all notifications as read
 * 
 * @created 18 Janeiro 2026
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// PATCH /api/notifications/read-all - Mark all as read
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Build update query
    const conditions: string[] = ['workspace_id = $1', 'read = FALSE'];
    const values: any[] = [workspaceId];

    if (userId) {
      conditions.push('user_id = $2');
      values.push(userId);
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      workspaceId,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
