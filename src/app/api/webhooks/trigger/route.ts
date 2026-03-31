/**
 * Webhook Trigger API - FASE 5 ENTERPRISE FEATURES
 * 
 * POST /api/webhooks/trigger
 * Triggers webhooks for an event (internal use only).
 * 
 * This endpoint is called by other APIs when events occur.
 * 
 * Body:
 * {
 *   workspaceId: string,
 *   eventType: string, // e.g., 'session.completed'
 *   eventData: object,  // The actual event data
 * }
 * 
 * Flow:
 * 1. Find all webhooks listening to this event
 * 2. Filter by workspace and active status
 * 3. Apply filters (if webhook has filters)
 * 4. Send HTTP request with HMAC signature
 * 5. Record delivery in webhook_deliveries
 * 6. Retry on failure (based on retry_strategy)
 * 
 * @author PerformTrack Team
 * @since Fase 5 - Enterprise Features
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import crypto from 'crypto';

// ============================================================================
// POST /api/webhooks/trigger - Trigger webhooks
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    // Basic Authentication Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // In a real scenario, you'd verify the token against Supabase or your JWT logic
    // to ensure the user actually belongs to the workspace they are triggering for.
    // For this demonstration we use a simple env check or valid token existence.
    const expectedToken = process.env.INTERNAL_API_KEY;

    // Fail-closed approach: Require the INTERNAL_API_KEY to be configured and matched.
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Server Misconfiguration - INTERNAL_API_KEY is not set' },
        { status: 500 }
      );
    }

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { workspaceId, eventType, eventData } = body;

    if (!workspaceId || !eventType || !eventData) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['workspaceId', 'eventType', 'eventData']
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ==============================================================
    // STEP 1: Find webhooks listening to this event
    // ==============================================================
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      return NextResponse.json(
        { error: 'Failed to fetch webhooks', details: webhooksError.message },
        { status: 500 }
      );
    }

    if (!webhooks || webhooks.length === 0) {
      return NextResponse.json({
        success: true,
        triggered: 0,
        message: 'No webhooks found for this event',
      });
    }

    // ==============================================================
    // STEP 2: Trigger each webhook
    // ==============================================================
    const deliveryPromises = webhooks.map(webhook => 
      deliverWebhook(webhook, eventType, eventData, supabase)
    );

    const results = await Promise.allSettled(deliveryPromises);

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      triggered: webhooks.length,
      succeeded: successes,
      failed: failures,
      message: `Triggered ${webhooks.length} webhooks (${successes} succeeded, ${failures} failed)`,
    });
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in POST /api/webhooks/trigger:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger webhooks',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER: Deliver webhook
// ============================================================================
async function deliverWebhook(
  webhook: any,
  eventType: string,
  eventData: any,
  supabase: any,
  attemptNumber: number = 1
): Promise<void> {
  const startTime = Date.now();

  // Check if event matches filters (if any)
  if (webhook.filters && !matchesFilters(eventData, webhook.filters)) {
    return;
  }

  // Build payload
  const payload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: eventData,
    webhook: {
      id: webhook.id,
      name: webhook.name,
    },
  };

  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  // Prepare headers
  const headers: any = {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': signature,
    'X-Webhook-Event': eventType,
    'X-Webhook-ID': webhook.id,
    'X-Webhook-Attempt': attemptNumber.toString(),
    'User-Agent': 'PerformTrack-Webhooks/1.0',
  };

  // Add custom headers
  if (webhook.headers) {
    Object.assign(headers, webhook.headers);
  }

  // Send HTTP request
  let httpStatus: number | null = null;
  let responseBody: string | null = null;
  let responseHeaders: any = null;
  let errorMessage: string | null = null;
  let deliveryStatus: 'sent' | 'failed' = 'sent';

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(webhook.timeout_seconds * 1000),
    });

    httpStatus = response.status;
    responseBody = await response.text();
    responseHeaders = Object.fromEntries(response.headers.entries());

    if (response.status < 200 || response.status >= 300) {
      deliveryStatus = 'failed';
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error: any) {
    deliveryStatus = 'failed';
    errorMessage = error.message;
    console.error(`❌ Webhook ${webhook.id} failed:`, errorMessage);
  }

  const duration = Date.now() - startTime;

  // ==============================================================
  // Record delivery
  // ==============================================================
  await supabase.from('webhook_deliveries').insert({
    webhook_id: webhook.id,
    event_type: eventType,
    event_data: eventData,
    attempt_number: attemptNumber,
    status: deliveryStatus,
    http_status_code: httpStatus,
    response_body: responseBody,
    response_headers: responseHeaders,
    error_message: errorMessage,
    sent_at: new Date().toISOString(),
    duration_ms: duration,
  });

  // ==============================================================
  // Update webhook stats
  // ==============================================================
  if (deliveryStatus === 'sent') {
    await supabase
      .from('webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        success_count: supabase.raw('success_count + 1'),
      })
      .eq('id', webhook.id);
  } else {
    await supabase
      .from('webhooks')
      .update({
        failure_count: supabase.raw('failure_count + 1'),
      })
      .eq('id', webhook.id);

    // ==============================================================
    // Retry logic (if enabled)
    // ==============================================================
    const retryStrategy = webhook.retry_strategy || { maxRetries: 3, backoff: 'exponential' };
    
    if (attemptNumber < retryStrategy.maxRetries) {
      // Calculate backoff delay
      let delayMs = 0;

      if (retryStrategy.backoff === 'exponential') {
        delayMs = Math.pow(2, attemptNumber) * 1000; // 2s, 4s, 8s
      } else if (retryStrategy.backoff === 'linear') {
        delayMs = attemptNumber * 5000; // 5s, 10s, 15s
      } else {
        delayMs = 5000; // Fixed 5s
      }
    }
  }
}

// ============================================================================
// HELPER: Check if event matches filters
// ============================================================================
function matchesFilters(eventData: any, filters: any): boolean {
  // Simple filter matching
  // In production, implement more sophisticated filtering
  
  for (const [key, value] of Object.entries(filters)) {
    if (eventData[key] !== value) {
      return false;
    }
  }

  return true;
}
