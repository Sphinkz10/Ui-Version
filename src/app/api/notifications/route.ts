/**
 * NOTIFICATIONS API - Main Endpoints
 * 
 * Handles notification CRUD operations
 * 
 * @route GET /api/notifications - List notifications
 * @route POST /api/notifications - Create notification
 * 
 * @created 18 Janeiro 2026
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  Notification,
  NotificationListResponse,
  CreateNotificationPayload,
  NotificationQuery,
} from '@/types/notifications';

// ============================================================================
// GET /api/notifications - List notifications
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query: NotificationQuery = {
      workspaceId: searchParams.get('workspaceId') || '',
      userId: searchParams.get('userId') || undefined,
      category: searchParams.get('category') as any,
      type: searchParams.get('type') as any,
      priority: searchParams.get('priority') as any,
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      includeArchived: searchParams.get('includeArchived') === 'true',
      athleteId: searchParams.get('athleteId') || undefined,
      eventId: searchParams.get('eventId') || undefined,
      relatedId: searchParams.get('relatedId') || undefined,
      relatedType: searchParams.get('relatedType') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'priority') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Validate required params
    if (!query.workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Build SQL query
    const conditions: string[] = ['workspace_id = $1'];
    const values: any[] = [query.workspaceId];
    let paramIndex = 2;

    // Add filters
    if (query.userId) {
      conditions.push(`user_id = $${paramIndex}`);
      values.push(query.userId);
      paramIndex++;
    }

    if (query.category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(query.category);
      paramIndex++;
    }

    if (query.type) {
      conditions.push(`type = $${paramIndex}`);
      values.push(query.type);
      paramIndex++;
    }

    if (query.priority) {
      conditions.push(`priority = $${paramIndex}`);
      values.push(query.priority);
      paramIndex++;
    }

    if (query.unreadOnly) {
      conditions.push('read = FALSE');
    }

    if (!query.includeArchived) {
      conditions.push('archived = FALSE');
    }

    if (query.athleteId) {
      conditions.push(`athlete_id = $${paramIndex}`);
      values.push(query.athleteId);
      paramIndex++;
    }

    if (query.eventId) {
      conditions.push(`event_id = $${paramIndex}`);
      values.push(query.eventId);
      paramIndex++;
    }

    if (query.relatedId) {
      conditions.push(`related_id = $${paramIndex}`);
      values.push(query.relatedId);
      paramIndex++;
    }

    if (query.relatedType) {
      conditions.push(`related_type = $${paramIndex}`);
      values.push(query.relatedType);
      paramIndex++;
    }

    if (query.fromDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(query.fromDate);
      paramIndex++;
    }

    if (query.toDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(query.toDate);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Order by
    const orderByClause =
      query.sortBy === 'priority'
        ? `CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END ${query.sortOrder}, created_at DESC`
        : `created_at ${query.sortOrder}`;

    // Pagination
    const offset = ((query.page || 1) - 1) * (query.limit || 20);

    // Get total count
    const countResult = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notifications?select=count`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );
    const countData = await countResult.json();
    const total = countData?.[0]?.count || 0;

    // Get unread count
    const unreadResult = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/notifications?select=count&read=eq.false&${whereClause}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );
    const unreadData = await unreadResult.json();
    const unreadCount = unreadData?.[0]?.count || 0;

    // Get notifications (mock data for now - replace with Supabase query)
    const mockNotifications: Notification[] = [];

    const response: NotificationListResponse = {
      notifications: mockNotifications,
      total,
      unreadCount,
      hasMore: offset + (query.limit || 20) < total,
      page: query.page || 1,
      limit: query.limit || 20,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/notifications - Create notification
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const payload: CreateNotificationPayload = await request.json();

    // Validate required fields
    if (!payload.workspaceId || !payload.userId || !payload.title || !payload.message) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, userId, title, message' },
        { status: 400 }
      );
    }

    // Validate enums
    const validTypes = ['alert', 'success', 'info', 'warning'];
    if (!validTypes.includes(payload.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: alert, success, info, or warning' },
        { status: 400 }
      );
    }

    const validCategories = [
      'pain',
      'session',
      'form',
      'athlete',
      'calendar',
      'decision',
      'system',
      'metric',
      'injury',
      'record',
    ];
    if (!validCategories.includes(payload.category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Create notification object
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: payload.workspaceId,
      userId: payload.userId,
      type: payload.type,
      category: payload.category,
      priority: payload.priority || 'normal',
      title: payload.title,
      message: payload.message,
      read: false,
      archived: false,
      eventId: payload.eventId,
      athleteId: payload.athleteId,
      relatedId: payload.relatedId,
      relatedType: payload.relatedType,
      actionUrl: payload.actionUrl,
      actionLabel: payload.actionLabel,
      metadata: payload.metadata || {},
      createdAt: new Date(),
      expiresAt: payload.expiresAt,
    };

    return NextResponse.json(
      {
        notification,
        message: 'Notification created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
