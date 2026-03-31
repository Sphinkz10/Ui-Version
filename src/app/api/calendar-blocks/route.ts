/**
 * Calendar Blocks API
 * 
 * GET /api/calendar-blocks
 * Query params:
 * - workspaceId (required)
 * - startDate, endDate (optional)
 * - blockType (optional)
 * 
 * POST /api/calendar-blocks
 * Body: { workspaceId, blockType, title, startDate, endDate, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - List blocks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const blockType = searchParams.get('blockType');
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    let query = supabase
      .from('calendar_blocks')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (startDate) {
      query = query.gte('end_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('start_date', endDate);
    }
    
    if (blockType) {
      query = query.eq('block_type', blockType);
    }
    
    // Execute query
    const { data: blocks, error } = await query;

    if (error) {
      console.error('Error fetching calendar blocks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blocks', details: error.message },
        { status: 500 }
      );
    }

    // 🚀 TEMPORARY MOCK DATA
    const useMockData = !blocks || blocks.length === 0;

    if (useMockData) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 🔧 FIX: Criar bloqueios mais VISÍVEIS
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayLocal = `${year}-${month}-${day}`;

      const mockBlocks = [
        // Bloqueio pontual de manutenção (12h-13h hoje)
        {
          id: 'block-1',
          workspace_id: workspaceId,
          type: 'maintenance',
          start_date: `${todayLocal}T12:00:00`,
          end_date: `${todayLocal}T13:00:00`,
          reason: '🔧 Manutenção do ginásio - Equipamento',
          all_day: false,
          created_at: new Date().toISOString(),
        },
        // Bloqueio de manhã cedo (6h-8h)
        {
          id: 'block-2',
          workspace_id: workspaceId,
          type: 'unavailable',
          start_date: `${todayLocal}T06:00:00`,
          end_date: `${todayLocal}T08:00:00`,
          reason: 'Instalações indisponíveis - Limpeza',
          all_day: false,
          created_at: new Date().toISOString(),
        },
        // Bloqueio tarde (19h-21h)
        {
          id: 'block-3',
          workspace_id: workspaceId,
          type: 'custom',
          start_date: `${todayLocal}T19:00:00`,
          end_date: `${todayLocal}T21:00:00`,
          reason: '⚠️ Evento privado agendado',
          all_day: false,
          created_at: new Date().toISOString(),
        },
      ];

      // Filter by date range
      let filteredBlocks = mockBlocks;

      if (startDate) {
        filteredBlocks = filteredBlocks.filter(b => b.start_date >= startDate);
      }

      if (endDate) {
        filteredBlocks = filteredBlocks.filter(b => b.start_date <= endDate);
      }

      return NextResponse.json({
        blocks: filteredBlocks,
        count: filteredBlocks.length,
        mock: true,
      });
    }

    return NextResponse.json({
      blocks: blocks || [],
      count: blocks?.length || 0,
    });
    
  } catch (error: any) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch blocks' },
      { status: 500 }
    );
  }
}

// POST - Create block
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: block, error } = await supabase
      .from('calendar_blocks')
      .insert({
        ...body,
        created_by: user?.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, block });
    
  } catch (error: any) {
    console.error('Error creating block:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create block' },
      { status: 500 }
    );
  }
}