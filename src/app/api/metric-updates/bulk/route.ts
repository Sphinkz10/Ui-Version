/**
 * Metric Updates Bulk API - SEMANA 4 ✅
 * 
 * POST /api/metric-updates/bulk - Create multiple updates at once
 * 
 * Used by LiveBoard for inline editing of multiple athletes
 * 
 * @author PerformTrack Team
 * @since Semana 4 - Data OS V2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      metricId,
      entries, // Array of { athlete_id, value, timestamp?, notes? }
      workspaceId = 'default-workspace',
      sourceType = 'manual',
      createdBy
    } = body;

    // Validation
    if (!metricId || !entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: metricId, entries (non-empty array)' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build bulk insert array
    const updates = entries.map((entry: any) => {
      // Determine value type and field
      let valueField = 'value_numeric';
      let value = entry.value;

      if (typeof value === 'string') {
        valueField = 'value_text';
      } else if (typeof value === 'boolean') {
        valueField = 'value_boolean';
      } else if (typeof value === 'object') {
        valueField = 'value_json';
        value = JSON.stringify(value);
      }

      return {
        workspace_id: workspaceId,
        athlete_id: entry.athlete_id,
        metric_id: metricId,
        [valueField]: value,
        timestamp: entry.timestamp || new Date().toISOString(),
        source_type: sourceType,
        notes: entry.notes,
        created_by: createdBy
      };
    });

    // Bulk insert
    const { data: created, error } = await supabase
      .from('metric_updates')
      .insert(updates)
      .select();

    if (error) {
      console.error('Error bulk creating metric updates:', error);
      return NextResponse.json(
        { error: 'Failed to bulk create metric updates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updates: created,
      count: created?.length || 0,
      message: `${created?.length || 0} metric updates created successfully`
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/metric-updates/bulk:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
