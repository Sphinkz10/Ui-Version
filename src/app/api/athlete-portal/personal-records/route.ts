/**
 * Athlete Portal - Personal Records API - FASE 4 ATHLETE PORTAL
 * 
 * GET /api/athlete-portal/personal-records
 * Returns the authenticated athlete's personal records.
 * 
 * Query params:
 * - category?: string - filter by category
 * - onlyCurrent?: boolean (default: true) - show only current records
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   records: [
 *     {
 *       id: string,
 *       metricName: string,
 *       recordType: string,
 *       value: number,
 *       unit: string,
 *       achievedAt: string,
 *       isCurrent: boolean,
 *       previousValue: number,
 *       improvement: number,
 *       source: string
 *     }
 *   ],
 *   stats: {
 *     total: number,
 *     recent: number (last 30 days),
 *     byCategory: { [category]: number }
 *   }
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 4 - Athlete Portal Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import jwt from 'jsonwebtoken';

// Helper to extract athlete from token
async function getAthleteFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as jwt.JwtPayload;
    return { athleteId: decoded.athleteId, workspaceId: decoded.workspaceId };
  } catch {
    return null;
  }
}

// ============================================================================
// GET /api/athlete-portal/personal-records - Get my personal records
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const auth = await getAthleteFromToken(request);

    if (!auth || !auth.athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }
    const { athleteId, workspaceId } = auth;

    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const onlyCurrent = searchParams.get('onlyCurrent') !== 'false'; // Default true

    const supabase = await createClient();

    // ==============================================================
    // STEP 1: Verify athlete belongs to workspace
    // ==============================================================
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('workspace_id', workspaceId) // SEC-002 Ensure workspace isolation
      .single();

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found or unauthorized' },
        { status: 404 }
      );
    }

    // ==============================================================
    // STEP 2: Get personal records
    // ==============================================================
    let recordsQuery = supabase
      .from('personal_records')
      .select(`
        id,
        metric_id,
        record_type,
        value,
        achieved_at,
        is_current,
        previous_value,
        source_session_id,
        source_metric_update_id,
        metadata,
        metrics (
          id,
          name,
          unit,
          category,
          type
        )
      `)
      .eq('athlete_id', athleteId)
      .order('achieved_at', { ascending: false });

    if (onlyCurrent) {
      recordsQuery = recordsQuery.eq('is_current', true);
    }

    const { data: records, error: recordsError } = await recordsQuery;

    if (recordsError) {
      console.error('Error fetching personal records:', recordsError);
      return NextResponse.json(
        { error: 'Failed to fetch records', details: recordsError.message },
        { status: 500 }
      );
    }

    // ==============================================================
    // STEP 2: Enrich records
    // ==============================================================
    let enrichedRecords = (records || []).map((record: any) => {
      const improvement = record.previous_value 
        ? record.value - record.previous_value 
        : null;
      
      const improvementPercent = record.previous_value && record.previous_value !== 0
        ? ((improvement! / record.previous_value) * 100).toFixed(1)
        : null;

      return {
        id: record.id,
        metricId: record.metric_id,
        metricName: record.metrics?.name,
        metricUnit: record.metrics?.unit,
        metricCategory: record.metrics?.category,
        metricType: record.metrics?.type,
        recordType: record.record_type,
        value: record.value,
        achievedAt: record.achieved_at,
        isCurrent: record.is_current,
        previousValue: record.previous_value,
        improvement,
        improvementPercent,
        source: record.source_session_id ? 'session' : 'metric_update',
        sourceId: record.source_session_id || record.source_metric_update_id,
        metadata: record.metadata,
      };
    });

    // Filter by category if provided
    if (category) {
      enrichedRecords = enrichedRecords.filter(
        (r: any) => r.metricCategory === category
      );
    }

    // ==============================================================
    // STEP 3: Calculate stats
    // ==============================================================
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = enrichedRecords.filter(
      (r: any) => new Date(r.achievedAt) > thirtyDaysAgo
    ).length;

    const byCategory: { [key: string]: number } = {};
    enrichedRecords.forEach((r: any) => {
      if (r.metricCategory) {
        byCategory[r.metricCategory] = (byCategory[r.metricCategory] || 0) + 1;
      }
    });

    const byType: { [key: string]: number } = {};
    enrichedRecords.forEach((r: any) => {
      if (r.recordType) {
        byType[r.recordType] = (byType[r.recordType] || 0) + 1;
      }
    });

    // ==============================================================
    // STEP 4: Get pending record suggestions
    // ==============================================================
    const { data: suggestions } = await supabase
      .from('record_suggestions')
      .select(`
        id,
        metric_id,
        record_type,
        suggested_value,
        current_record,
        improvement,
        confidence,
        suggested_at,
        metrics (
          name,
          unit,
          category
        )
      `)
      .eq('athlete_id', athleteId)
      .eq('status', 'pending')
      .order('suggested_at', { ascending: false })
      .limit(10);

    // ==============================================================
    // RETURN RECORDS
    // ==============================================================
    return NextResponse.json({
      records: enrichedRecords,
      suggestions: (suggestions || []).map((s: any) => ({
        id: s.id,
        metricId: s.metric_id,
        metricName: s.metrics?.name,
        metricUnit: s.metrics?.unit,
        metricCategory: s.metrics?.category,
        recordType: s.record_type,
        suggestedValue: s.suggested_value,
        currentRecord: s.current_record,
        improvement: s.improvement,
        confidence: s.confidence,
        suggestedAt: s.suggested_at,
      })),
      stats: {
        total: enrichedRecords.length,
        recent,
        byCategory,
        byType,
        pendingSuggestions: suggestions?.length || 0,
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athlete-portal/personal-records:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
