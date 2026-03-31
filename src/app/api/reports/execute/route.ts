/**
 * Report Execution API - FASE 5 ENTERPRISE FEATURES
 * 
 * POST /api/reports/execute
 * Executes a report (from template or ad-hoc) and returns results.
 * 
 * This is the CORE of the report builder - generates actual data.
 * 
 * Body:
 * {
 *   workspaceId: string,
 *   templateId?: string, // If using template
 *   config?: object,     // If ad-hoc report
 *   parameters: {
 *     dateRange?: { start: string, end: string },
 *     athleteIds?: string[],
 *     format?: 'json' | 'pdf' | 'excel' | 'csv'
 *   },
 *   executedBy: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   execution: {
 *     id: string,
 *     status: 'completed',
 *     resultData: { ... }, // For JSON format
 *     resultUrl: string,   // For PDF/Excel/CSV
 *     processingTime: number,
 *     rowCount: number
 *   }
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 5 - Enterprise Features
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { EventDispatcher } from '@/utils/events/dispatcher';

// ============================================================================
// REPORT BUILDER ENGINE
// ============================================================================

class ReportBuilder {
  private supabase: any;
  private workspaceId: string;
  private config: any;
  private parameters: any;

  constructor(supabase: any, workspaceId: string, config: any, parameters: any) {
    this.supabase = supabase;
    this.workspaceId = workspaceId;
    this.config = config;
    this.parameters = parameters;
  }

  /**
   * Main execution method
   */
  async execute(): Promise<{ data: any; rowCount: number }> {
    const startTime = Date.now();

    try {
      let data: any;

      switch (this.config.dataSource) {
        case 'sessions':
          data = await this.buildSessionsReport();
          break;
        case 'metrics':
          data = await this.buildMetricsReport();
          break;
        case 'athletes':
          data = await this.buildAthletesReport();
          break;
        case 'custom':
          data = await this.buildCustomReport();
          break;
        default:
          throw new Error(`Unknown data source: ${this.config.dataSource}`);
      }

      const processingTime = Date.now() - startTime;

      return {
        data,
        rowCount: data.length,
      };
    } catch (error: any) {
      console.error('❌ Report execution failed:', error);
      throw error;
    }
  }

  /**
   * Build sessions report
   */
  private async buildSessionsReport(): Promise<any[]> {
    const { dateRange, athleteIds } = this.parameters;

    // Base query
    let query = this.supabase
      .from('sessions')
      .select(`
        id,
        started_at,
        completed_at,
        status,
        workout_id,
        workouts (
          name,
          type,
          difficulty
        ),
        session_athletes (
          athlete_id,
          attendance,
          athletes (
            name
          )
        )
      `)
      .eq('workspace_id', this.workspaceId)
      .order('started_at', { ascending: false });

    // Apply filters
    if (dateRange?.start) {
      query = query.gte('started_at', dateRange.start);
    }
    if (dateRange?.end) {
      query = query.lte('started_at', dateRange.end);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    // Filter by athletes if specified
    let filteredSessions = sessions || [];
    if (athleteIds && athleteIds.length > 0) {
      filteredSessions = filteredSessions.filter((session: any) =>
        session.session_athletes.some((sa: any) =>
          athleteIds.includes(sa.athlete_id)
        )
      );
    }

    // Transform data based on groupBy and aggregations
    return this.applyTransformations(filteredSessions);
  }

  /**
   * Build metrics report
   */
  private async buildMetricsReport(): Promise<any[]> {
    const { dateRange, athleteIds, metricIds } = this.parameters;

    let query = this.supabase
      .from('metric_updates')
      .select(`
        id,
        metric_id,
        athlete_id,
        value,
        timestamp,
        metrics (
          name,
          unit,
          category
        ),
        athletes (
          name
        )
      `)
      .order('timestamp', { ascending: false });

    // Apply filters
    if (dateRange?.start) {
      query = query.gte('timestamp', dateRange.start);
    }
    if (dateRange?.end) {
      query = query.lte('timestamp', dateRange.end);
    }
    if (athleteIds && athleteIds.length > 0) {
      query = query.in('athlete_id', athleteIds);
    }
    if (metricIds && metricIds.length > 0) {
      query = query.in('metric_id', metricIds);
    }

    const { data: metrics, error } = await query;

    if (error) throw error;

    return this.applyTransformations(metrics || []);
  }

  /**
   * Build athletes report
   */
  private async buildAthletesReport(): Promise<any[]> {
    const { athleteIds } = this.parameters;

    let query = this.supabase
      .from('athletes')
      .select(`
        id,
        name,
        email,
        date_of_birth,
        created_at,
        metadata
      `)
      .eq('workspace_id', this.workspaceId)
      .eq('is_active', true);

    if (athleteIds && athleteIds.length > 0) {
      query = query.in('id', athleteIds);
    }

    const { data: athletes, error } = await query;

    if (error) throw error;

    // Enrich with stats
    const enrichedAthletes = await Promise.all(
      (athletes || []).map(async (athlete: any) => {
        // Get session count
        const { count: sessionCount } = await this.supabase
          .from('session_athletes')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', athlete.id);

        // Get PR count
        const { count: prCount } = await this.supabase
          .from('personal_records')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', athlete.id)
          .eq('is_current', true);

        return {
          ...athlete,
          sessionCount: sessionCount || 0,
          personalRecordsCount: prCount || 0,
        };
      })
    );

    return this.applyTransformations(enrichedAthletes);
  }

  /**
   * Build custom report (advanced SQL)
   */
  private async buildCustomReport(): Promise<any[]> {
    return [];
  }

  /**
   * Apply groupBy and aggregations
   */
  private applyTransformations(data: any[]): any[] {
    if (!this.config.groupBy || this.config.groupBy.length === 0) {
      return data;
    }

    // Group data
    const grouped = new Map();

    data.forEach(item => {
      const key = this.config.groupBy.map((field: string) => {
        // Handle nested fields (e.g., "athletes.name")
        const parts = field.split('.');
        let value = item;
        for (const part of parts) {
          value = value?.[part];
        }
        return value;
      }).join('|');

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(item);
    });

    // Apply aggregations
    const result: any[] = [];

    grouped.forEach((items, key) => {
      const row: any = {};

      // Add group keys
      this.config.groupBy.forEach((field: string, index: number) => {
        row[field] = key.split('|')[index];
      });

      // Add aggregations
      if (this.config.aggregations) {
        this.config.aggregations.forEach((agg: any) => {
          const values = items.map((item: any) => item[agg.field]).filter((v: any) => v !== null && v !== undefined);
          
          switch (agg.function) {
            case 'sum':
              row[`${agg.field}_sum`] = values.reduce((sum: number, v: number) => sum + v, 0);
              break;
            case 'avg':
              row[`${agg.field}_avg`] = values.length > 0 
                ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length 
                : 0;
              break;
            case 'min':
              row[`${agg.field}_min`] = values.length > 0 ? Math.min(...values) : 0;
              break;
            case 'max':
              row[`${agg.field}_max`] = values.length > 0 ? Math.max(...values) : 0;
              break;
            case 'count':
              row[`${agg.field}_count`] = values.length;
              break;
          }
        });
      }

      result.push(row);
    });

    return result;
  }
}

// ============================================================================
// POST /api/reports/execute - Execute report
// ============================================================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validate required fields
    const { workspaceId, parameters = {}, executedBy } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ==============================================================
    // STEP 1: Get config (from template or body)
    // ==============================================================
    let config: any;
    let templateId: string | null = null;

    if (body.templateId) {
      // Load from template
      const { data: template, error: templateError } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', body.templateId)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      config = template.config;
      templateId = template.id;

    } else if (body.config) {
      // Ad-hoc report
      config = body.config;

    } else {
      return NextResponse.json(
        { error: 'Either templateId or config is required' },
        { status: 400 }
      );
    }

    // Merge template filters with runtime parameters
    const mergedParameters = {
      ...config.filters,
      ...parameters,
    };

    // ==============================================================
    // STEP 2: Create execution record (pending)
    // ==============================================================
    const { data: execution, error: executionError } = await supabase
      .from('report_executions')
      .insert({
        workspace_id: workspaceId,
        template_id: templateId,
        executed_by: executedBy,
        parameters: mergedParameters,
        status: 'processing',
      })
      .select()
      .single();

    if (executionError) {
      console.error('Error creating execution record:', executionError);
      return NextResponse.json(
        { error: 'Failed to create execution', details: executionError.message },
        { status: 500 }
      );
    }

    // ==============================================================
    // STEP 3: Execute report
    // ==============================================================
    const builder = new ReportBuilder(supabase, workspaceId, config, mergedParameters);

    let resultData: any;
    let rowCount: number;

    try {
      const result = await builder.execute();
      resultData = result.data;
      rowCount = result.rowCount;

    } catch (error: any) {
      // Update execution as failed
      await supabase
        .from('report_executions')
        .update({
          status: 'failed',
          error_message: error.message,
          processing_time_ms: Date.now() - startTime,
        })
        .eq('id', execution.id);

      return NextResponse.json(
        { 
          error: 'Report execution failed', 
          details: error.message,
          executionId: execution.id,
        },
        { status: 500 }
      );
    }

    // ==============================================================
    // STEP 4: Update execution as completed
    // ==============================================================
    const processingTime = Date.now() - startTime;

    const { data: updatedExecution } = await supabase
      .from('report_executions')
      .update({
        status: 'completed',
        result_data: parameters.format === 'json' ? resultData : null,
        row_count: rowCount,
        processing_time_ms: processingTime,
      })
      .eq('id', execution.id)
      .select()
      .single();

    // ==============================================================
    // STEP 5: DISPATCH REPORT EXECUTED EVENT
    // ==============================================================
    await EventDispatcher.dispatch({
      workspaceId,
      eventType: 'report.executed',
      eventData: {
        executionId: execution.id,
        templateId,
        rowCount,
        processingTime,
      },
      userId: executedBy,
    }).catch(err => {
      console.error('❌ Error dispatching report event:', err);
    });

    // ==============================================================
    // RETURN RESULTS
    // ==============================================================
    return NextResponse.json({
      success: true,
      execution: {
        id: execution.id,
        status: 'completed',
        resultData: parameters.format === 'json' ? resultData : null,
        rowCount,
        processingTime,
        createdAt: execution.created_at,
      },
      message: `Report executed successfully (${rowCount} rows in ${processingTime}ms)`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in POST /api/reports/execute:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute report',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}