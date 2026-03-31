/**
 * Reports API - SEMANA 7 ✅
 * 
 * GET /api/reports - List reports with filters
 * POST /api/reports - Create new report
 * 
 * Features:
 * - Report templates
 * - Scheduled reports
 * - PDF/Excel generation
 * - Custom charts & tables
 * 
 * @author PerformTrack Team
 * @since Semana 7 - Reports + Automation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/reports - List reports
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category');
    const isTemplate = searchParams.get('isTemplate');
    const isScheduled = searchParams.get('isScheduled');
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
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Template filter
    if (isTemplate !== null) {
      query = query.eq('is_template', isTemplate === 'true');
    }

    // Scheduled filter
    if (isScheduled !== null) {
      query = query.eq('is_scheduled', isScheduled === 'true');
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reports: reports || [],
      count: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/reports - Create report
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workspace_id,
      name,
      description,
      category = 'custom',
      config,
      data_source,
      output_format = ['pdf'],
      template_id,
      is_scheduled = false,
      schedule_cron,
      recipients = [],
      is_template = false,
      tags = [],
      created_by
    } = body;

    // Validation
    if (!workspace_id || !name || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, name, config' },
        { status: 400 }
      );
    }

    // Validate config structure
    if (!config.sections && !config.charts && !config.tables) {
      return NextResponse.json(
        { error: 'Config must have at least sections, charts, or tables' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Calculate next generation time if scheduled
    let next_generation_at = null;
    if (is_scheduled && schedule_cron) {
      // TODO: Implement cron parser to calculate next run
      // For now, set to tomorrow at 9am
      next_generation_at = new Date();
      next_generation_at.setDate(next_generation_at.getDate() + 1);
      next_generation_at.setHours(9, 0, 0, 0);
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        workspace_id,
        name,
        description,
        category,
        config,
        data_source,
        output_format,
        template_id,
        is_scheduled,
        schedule_cron,
        recipients,
        next_generation_at,
        is_template,
        tags,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json(
        { error: 'Failed to create report', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      report,
      message: 'Report created successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
