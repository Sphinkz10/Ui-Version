/**
 * Automation Rules API - SEMANA 7 ✅
 * 
 * GET /api/automation/rules - List automation rules
 * POST /api/automation/rules - Create new rule
 * 
 * Features:
 * - Trigger configuration
 * - Action configuration
 * - Conditional logic
 * - Testing mode
 * 
 * @author PerformTrack Team
 * @since Semana 7 - Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/automation/rules - List rules
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('automation_rules')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('execution_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Active filter
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rules, error, count } = await query;

    if (error) {
      console.error('Error fetching automation rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch rules', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rules: rules || [],
      count: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/automation/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/automation/rules - Create rule
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workspace_id,
      name,
      description,
      category = 'custom',
      trigger_config,
      action_config,
      conditions,
      filters,
      execution_order = 0,
      delay_seconds = 0,
      retry_on_failure = true,
      max_retries = 3,
      is_active = true,
      is_test_mode = false,
      tags = [],
      created_by
    } = body;

    // Validation
    if (!workspace_id || !name || !trigger_config || !action_config) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, name, trigger_config, action_config' },
        { status: 400 }
      );
    }

    // Validate trigger_config structure
    if (!trigger_config.type) {
      return NextResponse.json(
        { error: 'trigger_config must have a type' },
        { status: 400 }
      );
    }

    // Validate action_config structure
    if (!action_config.type) {
      return NextResponse.json(
        { error: 'action_config must have a type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create rule
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert({
        workspace_id,
        name,
        description,
        category,
        trigger_config,
        action_config,
        conditions,
        filters,
        execution_order,
        delay_seconds,
        retry_on_failure,
        max_retries,
        is_active,
        is_test_mode,
        tags,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating automation rule:', error);
      return NextResponse.json(
        { error: 'Failed to create rule', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rule,
      message: 'Automation rule created successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/automation/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
