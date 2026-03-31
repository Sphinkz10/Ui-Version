/**
 * Metric Updates API - SEMANA 4 ✅
 * 
 * GET /api/metric-updates - List metric updates with filters
 * POST /api/metric-updates - Create new metric update
 * 
 * @author PerformTrack Team
 * @since Semana 4 - Data OS V2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/metric-updates - List updates
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const athleteId = searchParams.get('athleteId');
    const metricId = searchParams.get('metricId');
    const sourceType = searchParams.get('sourceType');
    const limit = parseInt(searchParams.get('limit') || '100');
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
      .from('metric_updates')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('timestamp', { ascending: false });

    // Apply filters
    if (athleteId) {
      query = query.eq('athlete_id', athleteId);
    }

    if (metricId) {
      query = query.eq('metric_id', metricId);
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: updates, error, count } = await query;

    if (error) {
      console.error('Error fetching metric updates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metric updates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updates: updates || [],
      count: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/metric-updates:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/metric-updates - Create update
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workspace_id,
      athlete_id,
      metric_id,
      value_numeric,
      value_text,
      value_boolean,
      value_json,
      unit,
      timestamp,
      source_type = 'manual',
      source_id,
      notes,
      created_by
    } = body;

    // Validation
    if (!workspace_id || !athlete_id || !metric_id) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, athlete_id, metric_id' },
        { status: 400 }
      );
    }

    // At least one value must be provided
    if (
      value_numeric === undefined &&
      value_text === undefined &&
      value_boolean === undefined &&
      value_json === undefined
    ) {
      return NextResponse.json(
        { error: 'At least one value field required (value_numeric, value_text, value_boolean, value_json)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create metric update
    const { data: update, error } = await supabase
      .from('metric_updates')
      .insert({
        workspace_id,
        athlete_id,
        metric_id,
        value_numeric,
        value_text,
        value_boolean,
        value_json,
        unit,
        timestamp: timestamp || new Date().toISOString(),
        source_type,
        source_id,
        notes,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating metric update:', error);
      return NextResponse.json(
        { error: 'Failed to create metric update', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      update,
      message: 'Metric update created successfully' 
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/metric-updates:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
