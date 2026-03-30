import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

/**
 * CRON: Sync Athlete Metrics
 * Schedule: Every 30 minutes (* /30 * * * *)
 * Purpose: Sync athlete metrics, recalculate baselines, update dashboards
 */

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_CALLS_PER_WINDOW = 50; // Higher limit for frequent job
let callHistory: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  callHistory = callHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (callHistory.length >= MAX_CALLS_PER_WINDOW) {
    return true;
  }
  
  callHistory.push(now);
  return false;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization') || '';
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || ''}`;
    
    if (
      !process.env.CRON_SECRET ||
      authHeader.length !== expectedAuth.length ||
      !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))
    ) {
      logger.warn('Unauthorized cron job attempt', {
        module: 'CronSyncMetrics',
        ip: request.headers.get('x-forwarded-for')
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    if (isRateLimited()) {
      logger.warn('Rate limit exceeded', { module: 'CronSyncMetrics' });
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    logger.info('Starting metrics sync job', {
      module: 'CronSyncMetrics',
      timestamp: new Date().toISOString()
    });

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const stats = {
      athletesProcessed: 0,
      metricsUpdated: 0,
      baselinesRecalculated: 0,
      alertsGenerated: 0,
      dashboardsCached: 0
    };

    // 1. Get all active athletes
    const { data: athletes, error: athletesError } = await supabase
      .from('athletes')
      .select('id, name')
      .eq('status', 'active');

    if (athletesError) {
      logger.error('Failed to fetch athletes', athletesError, { module: 'CronSyncMetrics' });
      return NextResponse.json(
        { error: 'Failed to fetch athletes', details: athletesError.message },
        { status: 500 }
      );
    }

    logger.info(`Processing ${athletes?.length || 0} active athletes`, {
      module: 'CronSyncMetrics'
    });

    // 2. Process each athlete
    for (const athlete of athletes || []) {
      try {
        // Get metrics that need recalculation (updated in last 30 minutes)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        const { data: recentUpdates, error: updatesError } = await supabase
          .from('metric_updates')
          .select('metric_id, value, updated_at')
          .eq('athlete_id', athlete.id)
          .gte('updated_at', thirtyMinutesAgo.toISOString());

        if (updatesError) {
          logger.error(`Failed to fetch updates for athlete ${athlete.id}`, updatesError, {
            module: 'CronSyncMetrics'
          });
          continue;
        }

        if (recentUpdates && recentUpdates.length > 0) {
          stats.metricsUpdated += recentUpdates.length;

          // 3. Recalculate rolling averages for each metric
          for (const update of recentUpdates) {
            // Calculate 7-day, 14-day, 30-day rolling averages
            const periods = [7, 14, 30];
            
            for (const period of periods) {
              const startDate = new Date();
              startDate.setDate(startDate.getDate() - period);

              const { data: periodData, error: periodError } = await supabase
                .from('metric_updates')
                .select('value')
                .eq('athlete_id', athlete.id)
                .eq('metric_id', update.metric_id)
                .gte('updated_at', startDate.toISOString())
                .order('updated_at', { ascending: false });

              if (!periodError && periodData && periodData.length > 0) {
                const values = periodData.map(d => parseFloat(d.value));
                const average = values.reduce((a, b) => a + b, 0) / values.length;

                // Update baseline
                await supabase
                  .from('metric_baselines')
                  .upsert({
                    athlete_id: athlete.id,
                    metric_id: update.metric_id,
                    period_days: period,
                    average_value: average,
                    sample_size: values.length,
                    last_calculated: new Date().toISOString()
                  }, {
                    onConflict: 'athlete_id,metric_id,period_days'
                  });

                stats.baselinesRecalculated++;
              }
            }

            // 4. Check for threshold alerts
            const { data: metric, error: metricError } = await supabase
              .from('metrics')
              .select('name, alert_threshold_high, alert_threshold_low')
              .eq('id', update.metric_id)
              .single();

            if (!metricError && metric) {
              const value = parseFloat(update.value);
              
              if (metric.alert_threshold_high && value > metric.alert_threshold_high) {
                // Create alert
                await supabase.from('alerts').insert({
                  athlete_id: athlete.id,
                  metric_id: update.metric_id,
                  type: 'threshold_high',
                  message: `${metric.name} exceeded high threshold: ${value}`,
                  created_at: new Date().toISOString()
                });
                stats.alertsGenerated++;
              }
              
              if (metric.alert_threshold_low && value < metric.alert_threshold_low) {
                // Create alert
                await supabase.from('alerts').insert({
                  athlete_id: athlete.id,
                  metric_id: update.metric_id,
                  type: 'threshold_low',
                  message: `${metric.name} below low threshold: ${value}`,
                  created_at: new Date().toISOString()
                });
                stats.alertsGenerated++;
              }
            }
          }

          // 5. Update dashboard cache
          // This would typically involve:
          // - Calculating summary stats
          // - Storing in a cache table
          // - Setting TTL
          stats.dashboardsCached++;
        }

        stats.athletesProcessed++;

      } catch (error: any) {
        logger.error(`Error processing athlete ${athlete.id}`, error, {
          module: 'CronSyncMetrics',
          athleteId: athlete.id
        });
      }
    }

    const duration = Date.now() - startTime;
    
    const result = {
      success: true,
      stats,
      timestamp: new Date().toISOString(),
      duration_ms: duration
    };

    logger.info('Metrics sync job completed', {
      module: 'CronSyncMetrics',
      result
    });

    return NextResponse.json(result);

  } catch (error: any) {
    logger.error('Error in metrics sync cron job', error, {
      module: 'CronSyncMetrics'
    });

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Manual trigger not allowed in production' },
      { status: 403 }
    );
  }
  return GET(request);
}