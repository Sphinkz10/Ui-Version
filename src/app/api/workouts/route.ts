/**
 * Workouts API - SEMANA 6 ✅
 * 
 * GET /api/workouts - List workouts with filters
 * POST /api/workouts - Create new workout
 * 
 * Features:
 * - Blocks structure (JSONB)
 * - Progression schemes
 * - Load prescriptions
 * - Templates support
 * - Full exercise details
 * 
 * @author PerformTrack Team
 * @since Semana 6 - Design Studio Complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/workouts - List workouts
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category');
    const isTemplate = searchParams.get('isTemplate');
    const search = searchParams.get('search');
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
      .from('workouts')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Template filter
    if (isTemplate !== null) {
      query = query.eq('is_template', isTemplate === 'true');
    }

    // Search
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: workouts, error, count } = await query;

    if (error) {
      console.error('Error fetching workouts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workouts', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workouts: workouts || [],
      count: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/workouts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/workouts - Create workout
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      workspace_id,
      name,
      description,
      category = 'strength',
      blocks = [],
      estimated_duration,
      difficulty_level = 'intermediate',
      equipment_needed = [],
      is_template = false,
      tags = [],
      progression_scheme,
      load_prescription,
      coaching_notes,
      created_by
    } = body;

    // Validation
    if (!workspace_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, name' },
        { status: 400 }
      );
    }

    if (!Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json(
        { error: 'Workout must have at least one block' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate that all exercises exist
    const exerciseIds = blocks.flatMap((block: any) => 
      block.exercises?.map((ex: any) => ex.exercise_id) || []
    ).filter(Boolean);

    if (exerciseIds.length > 0) {
      const { data: exercises, error: exError } = await supabase
        .from('exercises')
        .select('id')
        .in('id', exerciseIds);

      if (exError || !exercises || exercises.length !== exerciseIds.length) {
        return NextResponse.json(
          { error: 'One or more exercises not found' },
          { status: 400 }
        );
      }
    }

    // Create workout
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        workspace_id,
        name,
        description,
        category,
        blocks,
        estimated_duration,
        difficulty_level,
        equipment_needed,
        is_template,
        tags,
        progression_scheme,
        load_prescription,
        coaching_notes,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout:', error);
      return NextResponse.json(
        { error: 'Failed to create workout', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workout,
      message: 'Workout created successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/workouts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
