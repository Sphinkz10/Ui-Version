/**
 * Workout Detail API - SEMANA 6 ✅
 * 
 * GET /api/workouts/[id] - Get single workout with exercises
 * PUT /api/workouts/[id] - Update workout
 * DELETE /api/workouts/[id] - Delete workout
 * 
 * @author PerformTrack Team
 * @since Semana 6 - Design Studio
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/workouts/[id]
// ============================================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeExercises = searchParams.get('includeExercises') === 'true';

    const supabase = await createClient();

    const { data: workout, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !workout) {
      return NextResponse.json(
        { error: 'Workout not found', details: error?.message },
        { status: 404 }
      );
    }

    // Optionally fetch full exercise details
    if (includeExercises && workout.blocks) {
      const exerciseIds = workout.blocks.flatMap((block: any) => 
        block.exercises?.map((ex: any) => ex.exercise_id) || []
      ).filter(Boolean);

      if (exerciseIds.length > 0) {
        const { data: exercises } = await supabase
          .from('exercises')
          .select('*')
          .in('id', exerciseIds);

        // Map exercises to blocks
        const exercisesMap = new Map(
          exercises?.map(ex => [ex.id, ex]) || []
        );

        workout.blocks = workout.blocks.map((block: any) => ({
          ...block,
          exercises: block.exercises?.map((ex: any) => ({
            ...ex,
            exercise: exercisesMap.get(ex.exercise_id)
          }))
        }));
      }
    }

    return NextResponse.json({ workout });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/workouts/[id]
// ============================================================================
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
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
      coaching_notes
    } = body;

    const supabase = await createClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (blocks !== undefined) updateData.blocks = blocks;
    if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration;
    if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
    if (equipment_needed !== undefined) updateData.equipment_needed = equipment_needed;
    if (is_template !== undefined) updateData.is_template = is_template;
    if (tags !== undefined) updateData.tags = tags;
    if (progression_scheme !== undefined) updateData.progression_scheme = progression_scheme;
    if (load_prescription !== undefined) updateData.load_prescription = load_prescription;
    if (coaching_notes !== undefined) updateData.coaching_notes = coaching_notes;

    // Validate exercises if blocks updated
    if (blocks) {
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
    }

    const { data: workout, error } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout:', error);
      return NextResponse.json(
        { error: 'Failed to update workout', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      workout,
      message: 'Workout updated successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/workouts/[id]
// ============================================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    // Soft delete
    const { error } = await supabase
      .from('workouts')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting workout:', error);
      return NextResponse.json(
        { error: 'Failed to delete workout', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Workout deleted successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/workouts/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
