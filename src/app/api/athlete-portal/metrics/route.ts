/**
 * Athlete Portal - My Metrics API - FASE 4 ATHLETE PORTAL
 * 
 * GET /api/athlete-portal/metrics
 * Returns the authenticated athlete's metrics and their history.
 * 
 * Query params:
 * - metricId?: string - filter by specific metric
 * - category?: string - filter by metric category
 * - limit?: number (default: 100)
 * - startDate?: string (ISO 8601)
 * - endDate?: string (ISO 8601)
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   metrics: [
 *     {
 *       id: string,
 *       name: string,
 *       unit: string,
 *       category: string,
 *       latestValue: number,
 *       latestUpdate: string,
 *       trend: 'up' | 'down' | 'stable',
 *       history: [
 *         { value: number, timestamp: string, source: string }
 *       ]
 *     }
 *   ],
 *   summary: {
 *     totalMetrics: number,
 *     totalUpdates: number,
 *     categoryCounts: { [category]: number }
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
// GET /api/athlete-portal/metrics - Get my metrics
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
    
    // Get query params
    const metricId = searchParams.get('metricId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
    // STEP 2: Get all metrics for this workspace
    // ==============================================================
    let metricsQuery = supabase
      .from('metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    if (category) {
      metricsQuery = metricsQuery.eq('category', category);
    }

    if (metricId) {
      metricsQuery = metricsQuery.eq('id', metricId);
    }

    const { data: metrics, error: metricsError } = await metricsQuery;

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    // ==============================================================
    // STEP 3: For each metric, get my updates
    // ==============================================================
    const enrichedMetrics = await Promise.all(
      (metrics || []).map(async (metric: any) => {
        // Build query for metric updates
        let updatesQuery = supabase
          .from('metric_updates')
          .select('id, value, timestamp, source_type, source_id, metadata')
          .eq('athlete_id', athleteId)
          .eq('metric_id', metric.id)
          .order('timestamp', { ascending: false })
          .limit(limit);

        // Apply date filters
        if (startDate) {
          updatesQuery = updatesQuery.gte('timestamp', startDate);
        }

        if (endDate) {
          updatesQuery = updatesQuery.lte('timestamp', endDate);
        }

        const { data: updates } = await updatesQuery;

        // Get latest value
        const latestUpdate = updates && updates.length > 0 ? updates[0] : null;

        // Calculate trend (compare latest 2 values)
        let trend: 'up' | 'down' | 'stable' | null = null;
        if (updates && updates.length >= 2) {
          const latest = updates[0].value;
          const previous = updates[1].value;
          
          if (latest > previous) {
            trend = 'up';
          } else if (latest < previous) {
            trend = 'down';
          } else {
            trend = 'stable';
          }
        }

        // Calculate statistics
        const values = (updates || []).map((u: any) => u.value);
        const stats = values.length > 0 ? {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, v) => sum + v, 0) / values.length,
          count: values.length,
        } : null;

        return {
          id: metric.id,
          name: metric.name,
          description: metric.description,
          unit: metric.unit,
          type: metric.type,
          category: metric.category,
          format: metric.format,
          latestValue: latestUpdate?.value || null,
          latestUpdate: latestUpdate?.timestamp || null,
          trend,
          stats,
          history: (updates || []).map((u: any) => ({
            id: u.id,
            value: u.value,
            timestamp: u.timestamp,
            source: u.source_type,
            sourceId: u.source_id,
            metadata: u.metadata,
          })),
        };
      })
    );

    // ==============================================================
    // STEP 4: Calculate summary
    // ==============================================================
    const categoryCounts: { [key: string]: number } = {};
    enrichedMetrics.forEach(m => {
      if (m.category) {
        categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
      }
    });

    const totalUpdates = enrichedMetrics.reduce(
      (sum, m) => sum + (m.history?.length || 0), 
      0
    );

    // ==============================================================
    // RETURN METRICS
    // ==============================================================
    return NextResponse.json({
      metrics: enrichedMetrics,
      summary: {
        totalMetrics: enrichedMetrics.length,
        totalUpdates,
        categoryCounts,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
        },
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athlete-portal/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
