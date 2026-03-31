/**
 * Webhooks API - FASE 5 ENTERPRISE FEATURES
 * 
 * GET /api/webhooks
 * Returns configured webhooks.
 * 
 * POST /api/webhooks
 * Creates a new webhook.
 * 
 * DELETE /api/webhooks
 * Deletes a webhook.
 * 
 * Query params (GET):
 * - workspaceId: string (required)
 * 
 * Body (POST):
 * {
 *   workspaceId: string,
 *   name: string,
 *   description?: string,
 *   url: string,
 *   events: string[], // e.g., ['session.completed', 'form.submitted']
 *   filters?: object,
 *   headers?: object
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 5 - Enterprise Features
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

// ============================================================================
// GET /api/webhooks - List webhooks
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching webhooks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch webhooks', details: error.message },
        { status: 500 }
      );
    }

    // Don't expose secret in response
    const sanitized = (webhooks || []).map(webhook => ({
      ...webhook,
      secret: '***hidden***',
    }));

    return NextResponse.json({
      webhooks: sanitized,
      stats: {
        total: webhooks?.length || 0,
        active: webhooks?.filter(w => w.is_active).length || 0,
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/webhooks - Create webhook
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { workspaceId, name, url, events } = body;

    if (!workspaceId || !name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['workspaceId', 'name', 'url', 'events']
        },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = [
      'session.started',
      'session.completed',
      'session.cancelled',
      'form.submitted',
      'metric.updated',
      'record.achieved',
      'athlete.created',
      'athlete.updated',
      'workout.created',
      'calendar_event.created',
    ];

    const invalidEvents = events.filter(e => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid events', 
          invalid: invalidEvents,
          valid: validEvents,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Generate secret for HMAC signature
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .insert({
        workspace_id: workspaceId,
        name,
        description: body.description || null,
        url,
        events,
        secret,
        retry_strategy: body.retryStrategy || {
          maxRetries: 3,
          backoff: 'exponential',
        },
        timeout_seconds: body.timeoutSeconds || 30,
        filters: body.filters || null,
        headers: body.headers || null,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error creating webhook:', webhookError);
      return NextResponse.json(
        { error: 'Failed to create webhook', details: webhookError.message },
        { status: 500 }
      );
    }

    // Test the webhook (optional)
    if (body.testOnCreate) {
      await testWebhook(webhook.id, webhook.url, webhook.secret);
    }

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        // Return secret only on creation (user must save it)
        secret,
      },
      message: 'Webhook created successfully. Save the secret - it won\'t be shown again.',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/webhooks - Delete webhook
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhookId');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'webhookId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) {
      console.error('Error deleting webhook:', error);
      return NextResponse.json(
        { error: 'Failed to delete webhook', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });

  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/webhooks:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Test webhook
// ============================================================================
async function testWebhook(webhookId: string, url: string, secret: string): Promise<void> {
  const testPayload = {
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook delivery',
      webhookId,
    },
  };

  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(testPayload))
    .digest('hex');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'User-Agent': 'PerformTrack-Webhooks/1.0',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000), // 10s timeout for test
    });
  } catch (error: any) {
    console.error('❌ Test webhook failed:', error.message);
    throw error;
  }
}
