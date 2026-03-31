/**
 * Form Field Metric Links API - SEMANA 5 ✅
 * 
 * POST /api/forms/[formId]/metric-links - Link form field to metric
 * GET /api/forms/[formId]/metric-links - List links for form
 * PUT /api/forms/[formId]/metric-links/[linkId] - Update link config
 * DELETE /api/forms/[formId]/metric-links/[linkId] - Remove link
 * 
 * @author PerformTrack Team
 * @since Semana 5 - Form Center
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET - List metric links for form
// ============================================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;

    const supabase = await createClient();

    const { data: links, error } = await supabase
      .from('form_field_metric_links')
      .select(`
        *,
        metrics!inner(
          id,
          name,
          data_type,
          unit,
          category
        )
      `)
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching metric links:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metric links', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      links: links || [],
      count: links?.length || 0
    });

  } catch (error: any) {
    console.error('Unexpected error in GET metric-links:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create metric link
// ============================================================================
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;
    const body = await request.json();

    const {
      field_id,
      field_name,
      metric_id,
      transformation_config,
      auto_create_metric = false,
      is_active = true,
      created_by
    } = body;

    // Validation
    if (!field_id || !field_name) {
      return NextResponse.json(
        { error: 'Missing required fields: field_id, field_name' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // If auto_create_metric, create metric first
    let targetMetricId = metric_id;

    if (auto_create_metric && !metric_id) {
      // Auto-create metric based on field
      const { data: newMetric, error: metricError } = await supabase
        .from('metrics')
        .insert({
          workspace_id: body.workspace_id || 'default-workspace',
          name: field_name,
          data_type: body.metric_data_type || 'numeric',
          category: body.metric_category || 'custom',
          unit: body.metric_unit,
          created_by
        })
        .select()
        .single();

      if (metricError) {
        console.error('Error auto-creating metric:', metricError);
        return NextResponse.json(
          { error: 'Failed to auto-create metric', details: metricError.message },
          { status: 500 }
        );
      }

      targetMetricId = newMetric.id;
    }

    if (!targetMetricId) {
      return NextResponse.json(
        { error: 'Either metric_id or auto_create_metric must be provided' },
        { status: 400 }
      );
    }

    // Create link
    const { data: link, error: linkError } = await supabase
      .from('form_field_metric_links')
      .insert({
        form_id: formId,
        field_id,
        field_name,
        metric_id: targetMetricId,
        transformation_config: transformation_config || { type: 'none' },
        is_active,
        created_by
      })
      .select(`
        *,
        metrics!inner(
          id,
          name,
          data_type,
          unit,
          category
        )
      `)
      .single();

    if (linkError) {
      console.error('Error creating metric link:', linkError);
      return NextResponse.json(
        { error: 'Failed to create metric link', details: linkError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      link,
      message: 'Metric link created successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in POST metric-links:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
