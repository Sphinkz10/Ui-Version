/**
 * Custom Metrics API - Data OS V3
 * 
 * GET  /api/custom-metrics - List custom metrics
 * POST /api/custom-metrics - Create custom metric
 * 
 * IMPORTANTE: V3 não interfere com métricas normais!
 * Custom metrics são adicionais e podem usar métricas normais como fonte.
 * 
 * @author PerformTrack Team
 * @since Week 2 Day 3-4 - Data OS V3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/custom-metrics - List custom metrics
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query params
    const workspaceId = searchParams.get('workspace_id');
    const category = searchParams.get('category');
    const visibility = searchParams.get('visibility');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('custom_metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (visibility) {
      query = query.eq('visibility', visibility);
    } else {
      // Default: show workspace and user's private metrics
      query = query.or(`visibility.eq.workspace,and(visibility.eq.private,created_by.eq.${user.id})`);
    }

    const { data: customMetrics, error } = await query;

    if (error) {
      console.error('Error fetching custom metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch custom metrics', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customMetrics: customMetrics || [],
      total: customMetrics?.length || 0
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/custom-metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/custom-metrics - Create custom metric
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      );
    }

    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!body.formula) {
      return NextResponse.json(
        { error: 'formula is required' },
        { status: 400 }
      );
    }

    if (!body.formula_type) {
      return NextResponse.json(
        { error: 'formula_type is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ============================================================
    // STEP 1: Validate formula
    // ============================================================
    
    // TODO: Call formula validation endpoint
    // For now, basic validation
    if (!body.formula.trim()) {
      return NextResponse.json(
        { error: 'Formula cannot be empty' },
        { status: 400 }
      );
    }

    // ============================================================
    // STEP 2: Create custom metric record
    // ============================================================

    const customMetricRecord = {
      workspace_id: body.workspace_id,
      name: body.name,
      description: body.description || null,
      unit: body.unit || null,
      category: body.category || 'custom',
      formula_type: body.formula_type,
      formula: body.formula,
      source_metrics: body.source_metrics || [],
      display_config: body.display_config || {
        chartType: 'line',
        colorScheme: 'emerald',
        showBaseline: false,
        showTrend: true,
        decimals: 2
      },
      visibility: body.visibility || 'workspace',
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: customMetric, error: insertError } = await supabase
      .from('custom_metrics')
      .insert(customMetricRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating custom metric:', insertError);
      return NextResponse.json(
        { error: 'Failed to create custom metric', details: insertError.message },
        { status: 500 }
      );
    }

    // ============================================================
    // STEP 3: Calculate initial values (optional)
    // ============================================================

    if (body.calculate_now && body.athlete_ids) {}

    return NextResponse.json({
      customMetric,
      message: 'Custom metric created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/custom-metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
