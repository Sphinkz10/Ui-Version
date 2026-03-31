/**
 * Exercise Detail API - SEMANA 6 ✅
 * 
 * GET /api/exercises/[id] - Get single exercise
 * PUT /api/exercises/[id] - Update exercise
 * DELETE /api/exercises/[id] - Delete exercise
 * 
 * @author PerformTrack Team
 * @since Semana 6 - Design Studio
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// GET /api/exercises/[id]
// ============================================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const { data: exercise, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !exercise) {
      return NextResponse.json(
        { error: 'Exercise not found', details: error?.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ exercise });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/exercises/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/exercises/[id]
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
      muscle_groups,
      equipment,
      custom_fields,
      media_url,
      video_url,
      instructions,
      coaching_notes,
      difficulty_level,
      tags
    } = body;

    const supabase = await createClient();

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (muscle_groups !== undefined) updateData.muscle_groups = muscle_groups;
    if (equipment !== undefined) updateData.equipment = equipment;
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields;
    if (media_url !== undefined) updateData.media_url = media_url;
    if (video_url !== undefined) updateData.video_url = video_url;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (coaching_notes !== undefined) updateData.coaching_notes = coaching_notes;
    if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
    if (tags !== undefined) updateData.tags = tags;

    const { data: exercise, error } = await supabase
      .from('exercises')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating exercise:', error);
      return NextResponse.json(
        { error: 'Failed to update exercise', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exercise,
      message: 'Exercise updated successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/exercises/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/exercises/[id]
// ============================================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    // Soft delete by setting is_active = false
    const { error } = await supabase
      .from('exercises')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting exercise:', error);
      return NextResponse.json(
        { error: 'Failed to delete exercise', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Exercise deleted successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/exercises/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
