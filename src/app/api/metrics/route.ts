/**
 * Metrics API Endpoint - SEMANA 1
 * 
 * GET /api/metrics - List metrics with filters
 * POST /api/metrics - Create new metric
 * 
 * @author PerformTrack Team
 * @since Semana 1 - Backend Essencial
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// METRICS DATA STORE
// ============================================================================
// Supabase is now the single source of truth

// ============================================================================
// GET /api/metrics - List metrics
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const packId = searchParams.get('packId');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags'); // comma-separated
    const isActive = searchParams.get('isActive') !== 'false';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Try to use Supabase, fallback to mock data
    let metrics = MOCK_METRICS;
    let usingMockData = false;

    try {
      const supabase = await createClient();

      let query = supabase
        .from('metrics')
        .select(`
          *,
          metric_packs (
            id,
            name,
            category,
            is_global
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })
        .limit(limit);

      // Apply filters
      if (packId) {
        query = query.eq('pack_id', packId);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (isActive) {
        query = query.eq('is_active', true);
      }

      // Filter by tags (if metrics have tags array)
      if (tags) {
        const tagArray = tags.split(',').map(t => t.trim());
        query = query.overlaps('tags', tagArray);
      }

      const { data, error } = await query;

      if (error) {
        usingMockData = true;
      } else if (data) {
        metrics = data;
      }
    } catch (error: any) {
      usingMockData = true;
    }

    // Apply client-side filters to mock data
    let filteredMetrics = metrics;
    if (usingMockData) {
      filteredMetrics = metrics.filter(m => {
        if (packId && m.pack_id !== packId) return false;
        if (category && m.category !== category) return false;
        if (isActive && !m.is_active) return false;
        return true;
      });
    }

    // Group by category
    const grouped = (filteredMetrics || []).reduce((acc: any, metric: any) => {
      const cat = metric.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(metric);
      return acc;
    }, {});

    return NextResponse.json({
      metrics: filteredMetrics || [],
      grouped,
      count: filteredMetrics?.length || 0,
      _mockData: usingMockData,
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/metrics:', error);

    // Return mock data as ultimate fallback
    const grouped = MOCK_METRICS.reduce((acc: any, metric: any) => {
      const cat = metric.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(metric);
      return acc;
    }, {});

    return NextResponse.json({
      metrics: MOCK_METRICS,
      grouped,
      count: MOCK_METRICS.length,
      _mockData: true,
      _error: error.message,
    });
  }
}

// ============================================================================
// POST /api/metrics - Create new metric
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workspaceId,
      packId,
      name,
      displayName,
      description,
      category,
      unit,
      type,
      tags,
      aggregationMethod,
      baselineMethod,
      baselinePeriodDays,
      baselineManualValue,
      validationRules,
      createdBy,
    } = body;

    // Validation
    if (!workspaceId || !name) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['workspaceId', 'name']
        },
        { status: 400 }
      );
    }

    // Validate aggregation method
    const validAggregationMethods = ['latest', 'average', 'sum', 'max', 'min'];
    if (aggregationMethod && !validAggregationMethods.includes(aggregationMethod)) {
      return NextResponse.json(
        {
          error: 'Invalid aggregation method',
          validMethods: validAggregationMethods
        },
        { status: 400 }
      );
    }

    // Validate baseline method
    const validBaselineMethods = ['rolling-average', 'manual', 'percentile'];
    if (baselineMethod && !validBaselineMethods.includes(baselineMethod)) {
      return NextResponse.json(
        {
          error: 'Invalid baseline method',
          validMethods: validBaselineMethods
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check for duplicate name in workspace
    const { data: existing } = await supabase
      .from('metrics')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A metric with this name already exists in this workspace' },
        { status: 409 }
      );
    }

    // Auto-configure aggregation method based on name patterns
    let finalAggregationMethod = aggregationMethod || 'latest';
    if (!aggregationMethod) {
      const nameLower = name.toLowerCase();
      if (nameLower.includes('volume') || nameLower.includes('load') || nameLower.includes('distance')) {
        finalAggregationMethod = 'sum';
      } else if (nameLower.includes('rpe') || nameLower.includes('pain') || nameLower.includes('stress')) {
        finalAggregationMethod = 'max';
      } else if (nameLower.includes('hrv')) {
        finalAggregationMethod = 'max'; // Higher is better
      } else if (nameLower.includes('rhr')) {
        finalAggregationMethod = 'min'; // Lower is better
      } else if (nameLower.includes('sleep') || nameLower.includes('recovery') || nameLower.includes('quality')) {
        finalAggregationMethod = 'average';
      }
    }

    // Create metric
    const { data: metric, error } = await supabase
      .from('metrics')
      .insert({
        workspace_id: workspaceId,
        pack_id: packId || null,
        name,
        display_name: displayName || name,
        description: description || null,
        category: category || null,
        unit: unit || null,
        type: type || null,
        tags: tags || [],
        aggregation_method: finalAggregationMethod,
        baseline_method: baselineMethod || 'rolling-average',
        baseline_period_days: baselinePeriodDays || 28,
        baseline_manual_value: baselineManualValue || null,
        validation_rules: validationRules || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating metric:', error);
      return NextResponse.json(
        { error: 'Failed to create metric', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metric,
      autoConfigured: !aggregationMethod ? {
        aggregationMethod: finalAggregationMethod,
        reason: 'Auto-detected based on metric name'
      } : null,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}