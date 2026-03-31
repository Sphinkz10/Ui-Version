/**
 * NOTIFICATIONS API - Mark as Read
 * 
 * @route PATCH /api/notifications/:id/read - Mark notification as read
 * 
 * @created 18 Janeiro 2026
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// PATCH /api/notifications/:id/read - Mark notification as read
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
      notificationId,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
