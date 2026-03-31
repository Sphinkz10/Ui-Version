/**
 * API Route: /api/decisions/evaluate
 * 
 * FASE 8 DAY 6: Manual engine evaluation
 * 
 * Endpoints:
 * - POST /api/decisions/evaluate - Manually trigger decision engine
 * 
 * Use cases:
 * - Testing engine with specific athletes
 * - Force re-evaluation (ignore cooldowns)
 * - Webhook after metric update
 * - Admin dashboard "Run Now" button
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDecisionEngine, runDecisionEngineForAthlete, checkEngineHealth } from '@/lib/decision-engine/runner';
import type { TriggerEngineRequest, EngineRunResult } from '@/lib/decision-engine/types';

// ============================================================================
// POST /api/decisions/evaluate
// ============================================================================

/**
 * Manually trigger decision engine
 * 
 * Body:
 * {
 *   workspaceId: string,         // Required
 *   athleteIds?: string[],       // Optional: specific athletes
 *   ruleIds?: string[],          // Optional: specific rules
 *   force?: boolean,             // Optional: ignore cooldowns
 *   dryRun?: boolean             // Optional: don't save decisions
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body: TriggerEngineRequest = await request.json();

    // Validate workspaceId
    if (!body.workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Check if specific athlete requested (faster)
    if (body.athleteIds && body.athleteIds.length === 1) {
      const decisions = await runDecisionEngineForAthlete(
        body.athleteIds[0],
        body.workspaceId,
        {
          skipCooldown: body.force,
          dryRun: true, // Always dry run for single athlete
        }
      );

      return NextResponse.json(
        {
          success: true,
          mode: 'single-athlete',
          athleteId: body.athleteIds[0],
          decisions,
          duration: Date.now() - startTime,
        },
        { status: 200 }
      );
    }

    const result: EngineRunResult = await runDecisionEngine(body.workspaceId, {
      athleteIds: body.athleteIds,
      ruleIds: body.ruleIds,
      skipCooldown: body.force,
      dryRun: false, // Actually save decisions
    });

    // Return result
    return NextResponse.json(
      {
        success: true,
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error triggering engine:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to trigger decision engine',
        details: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/decisions/evaluate (Health Check)
// ============================================================================

/**
 * Check engine health status
 * 
 * Returns:
 * - Overall health status
 * - Individual component checks
 * - Configuration
 * - Next scheduled run
 */
export async function GET(request: NextRequest) {
  try {
    const health = await checkEngineHealth();

    const response = {
      healthy: health.healthy,
      timestamp: new Date().toISOString(),
      checks: health.checks,
      errors: health.errors,
      version: '1.0.0',
      uptime: process.uptime(),
    };

    const statusCode = health.healthy ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('[API] Error checking engine health:', error);
    
    return NextResponse.json(
      {
        healthy: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
