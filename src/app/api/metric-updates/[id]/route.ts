/**
 * Metric Update Detail API - SEMANA 4 ✅
 * 
 * GET /api/metric-updates/[id] - Get single update
 * PUT /api/metric-updates/[id] - Update metric update
 * DELETE /api/metric-updates/[id] - Delete metric update
 * 
 * @author PerformTrack Team
 * @since Semana 4 - Data OS V2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/metric-updates/[id]
// ============================================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const { data: update, error } = await supabase
      .from('metric_updates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !update) {
      return NextResponse.json(
        { error: 'Metric update not found', details: error?.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ update });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/metric-updates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/metric-updates/[id]
// ============================================================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      value_numeric,
      value_text,
      value_boolean,
      value_json,
      unit,
      timestamp,
      notes
    } = body;

    const supabase = await createClient();

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (value_numeric !== undefined) updateData.value_numeric = value_numeric;
    if (value_text !== undefined) updateData.value_text = value_text;
    if (value_boolean !== undefined) updateData.value_boolean = value_boolean;
    if (value_json !== undefined) updateData.value_json = value_json;
    if (unit !== undefined) updateData.unit = unit;
    if (timestamp !== undefined) updateData.timestamp = timestamp;
    if (notes !== undefined) updateData.notes = notes;

    const { data: update, error } = await supabase
      .from('metric_updates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating metric update:', error);
      return NextResponse.json(
        { error: 'Failed to update metric update', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      update,
      message: 'Metric update updated successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/metric-updates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/metric-updates/[id]
// ============================================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const { error } = await supabase
      .from('metric_updates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting metric update:', error);
      return NextResponse.json(
        { error: 'Failed to delete metric update', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Metric update deleted successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/metric-updates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
