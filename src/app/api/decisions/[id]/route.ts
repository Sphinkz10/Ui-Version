/**
 * API Route: /api/decisions/[id]
 * 
 * FASE 8 DAY 6: Single decision management
 * 
 * Endpoints:
 * - GET   /api/decisions/[id] - Get decision details
 * - PATCH /api/decisions/[id] - Update decision (apply/dismiss)
 * - DELETE /api/decisions/[id] - Delete decision (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { mockDecisions } from '@/data/mock/mockDecisions';
import type { Decision, UpdateDecisionRequest } from '@/lib/decision-engine/types';

// ============================================================================
// GET /api/decisions/[id]
// ============================================================================

/**
 * Get single decision by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find decision in mock data
    const decision = mockDecisions.find(d => d.id === id);
    
    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }
    
    // TODO: In production, fetch from database
    // const supabase = createClient();
    // const { data, error } = await supabase
    //   .from('decisions')
    //   .select('*')
    //   .eq('id', id)
    //   .single();
    
    return NextResponse.json(
      { decision },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
    
  } catch (error) {
    console.error('[API] Error fetching decision:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/decisions/[id]
// ============================================================================

/**
 * Update decision status (apply or dismiss)
 * 
 * Body:
 * {
 *   status: 'applied' | 'dismissed',
 *   notes?: string,
 *   dismissReason?: string  // Required if dismissing
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: UpdateDecisionRequest = await request.json();

    // Validate status
    if (!['applied', 'dismissed'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "applied" or "dismissed"' },
        { status: 400 }
      );
    }

    // Validate dismissReason if dismissing
    if (body.status === 'dismissed' && !body.dismissReason) {
      return NextResponse.json(
        { error: 'dismissReason is required when dismissing a decision' },
        { status: 400 }
      );
    }

    // Find decision
    const decision = mockDecisions.find(d => d.id === id);

    if (!decision) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (decision.status !== 'pending') {
      return NextResponse.json(
        { 
          error: `Decision already ${decision.status}`,
          currentStatus: decision.status
        },
        { status: 400 }
      );
    }

    // Build update object
    const now = new Date().toISOString();
    const userId = 'coach-001'; // TODO: Get from auth session

    const updates: Partial<Decision> = {
      status: body.status,
      notes: body.notes,
    };

    if (body.status === 'applied') {
      updates.appliedAt = now;
      updates.appliedBy = userId;
    } else if (body.status === 'dismissed') {
      updates.dismissedAt = now;
      updates.dismissedBy = userId;
      updates.dismissReason = body.dismissReason;
    }

    // Apply updates (mock)
    Object.assign(decision, updates);

    return NextResponse.json(
      { 
        success: true,
        decision 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error updating decision:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/decisions/[id]
// ============================================================================

/**
 * Delete decision (admin only)
 * 
 * Only for testing/admin purposes.
 * Normally decisions should be dismissed, not deleted.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: Check admin permissions
    // const session = await getSession();
    // if (!session.user.isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 403 }
    //   );
    // }

    // Find decision
    const decisionIndex = mockDecisions.findIndex(d => d.id === id);

    if (decisionIndex === -1) {
      return NextResponse.json(
        { error: 'Decision not found' },
        { status: 404 }
      );
    }

    // Remove from mock array (in production, delete from DB)
    mockDecisions.splice(decisionIndex, 1);

    return NextResponse.json(
      { 
        success: true,
        message: 'Decision deleted' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Error deleting decision:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete decision',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
