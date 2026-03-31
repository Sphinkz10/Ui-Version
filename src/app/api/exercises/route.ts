/**
 * Exercises API - SEMANA 6 ✅
 * 
 * GET /api/exercises - List exercises with filters
 * POST /api/exercises - Create new exercise
 * 
 * Features:
 * - Custom fields (JSONB)
 * - Media attachments
 * - Categories & tags
 * - Muscle groups & equipment
 * - Full-text search
 * 
 * @author PerformTrack Team
 * @since Semana 6 - Design Studio Complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/exercises - List exercises
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category');
    const muscleGroup = searchParams.get('muscleGroup');
    const equipment = searchParams.get('equipment');
    const search = searchParams.get('search');
    const isGlobal = searchParams.get('isGlobal');
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
      .from('exercises')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true });

    // Workspace or global filter
    if (isGlobal === 'true') {
      query = query.eq('is_global', true);
    } else {
      query = query.or(`workspace_id.eq.${workspaceId},is_global.eq.true`);
    }

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Muscle group filter (JSONB array contains)
    if (muscleGroup) {
      query = query.contains('muscle_groups', [muscleGroup]);
    }

    // Equipment filter (JSONB array contains)
    if (equipment) {
      query = query.contains('equipment', [equipment]);
    }

    // Full-text search
    if (search) {
      query = query.textSearch('name', search, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: exercises, error, count } = await query;

    if (error) {
      console.error('Error fetching exercises:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exercises', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exercises: exercises || [],
      count: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/exercises - Create exercise
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workspace_id,
      name,
      description,
      category,
      muscle_groups = [],
      equipment = [],
      custom_fields = [],
      media_url,
      video_url,
      instructions,
      coaching_notes,
      difficulty_level = 'intermediate',
      is_global = false,
      tags = [],
      created_by
    } = body;

    // Validation
    if (!workspace_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, name' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create exercise
    const { data: exercise, error } = await supabase
      .from('exercises')
      .insert({
        workspace_id,
        name,
        description,
        category,
        muscle_groups,
        equipment,
        custom_fields,
        media_url,
        video_url,
        instructions,
        coaching_notes,
        difficulty_level,
        is_global,
        tags,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise:', error);
      return NextResponse.json(
        { error: 'Failed to create exercise', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exercise,
      message: 'Exercise created successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/exercises:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
