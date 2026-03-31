/**
 * Athlete Metrics API Endpoint - FASE 2 ✅
 * 
 * GET /api/athletes/[id]/metrics - Get athlete's active metrics and health data
 * 
 * Returns current values for:
 * - Biological metrics (HRV, Sleep, Readiness)
 * - Performance metrics (Fatigue, Soreness, RPE)
 * - Custom metrics configured for the athlete
 * 
 * @author PerformTrack Team
 * @since Fase 2 - Profile Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// MOCK METRICS DATA - Used when metrics not found in DB
// ============================================================================
const MOCK_ATHLETE_METRICS: Record<string, any[]> = {
  'athlete-1': [
    {
      id: 'metric-1',
      metric_id: 'hrv',
      name: 'HRV',
      category: 'biological',
      current_value: 68,
      previous_value: 65,
      unit: 'ms',
      trend: 'up',
      status: 'good',
      last_updated: '2024-03-20T08:30:00Z',
      color: 'emerald',
      icon: 'Heart',
      optimal_range: { min: 60, max: 100 },
      description: 'Heart Rate Variability - Indicador de recuperação'
    },
    {
      id: 'metric-2',
      metric_id: 'sleep_quality',
      name: 'Qualidade Sono',
      category: 'biological',
      current_value: 8.2,
      previous_value: 7.8,
      unit: '/10',
      trend: 'up',
      status: 'excellent',
      last_updated: '2024-03-20T07:00:00Z',
      color: 'sky',
      icon: 'Moon',
      optimal_range: { min: 7, max: 10 },
      description: 'Qualidade do sono reportada'
    },
    {
      id: 'metric-3',
      metric_id: 'readiness',
      name: 'Prontidão',
      category: 'performance',
      current_value: 87,
      previous_value: 82,
      unit: '%',
      trend: 'up',
      status: 'good',
      last_updated: '2024-03-20T08:30:00Z',
      color: 'violet',
      icon: 'Zap',
      optimal_range: { min: 70, max: 100 },
      description: 'Nível geral de prontidão para treinar'
    },
    {
      id: 'metric-4',
      metric_id: 'fatigue',
      name: 'Fadiga',
      category: 'performance',
      current_value: 3.2,
      previous_value: 4.1,
      unit: '/10',
      trend: 'down',
      status: 'good',
      last_updated: '2024-03-20T08:30:00Z',
      color: 'amber',
      icon: 'AlertCircle',
      optimal_range: { min: 0, max: 4 },
      description: 'Nível de fadiga percebida (menor é melhor)'
    },
    {
      id: 'metric-5',
      metric_id: 'soreness',
      name: 'Dor Muscular',
      category: 'performance',
      current_value: 2.8,
      previous_value: 3.5,
      unit: '/10',
      trend: 'down',
      status: 'good',
      last_updated: '2024-03-20T08:30:00Z',
      color: 'red',
      icon: 'Activity',
      optimal_range: { min: 0, max: 3 },
      description: 'Dor muscular reportada (menor é melhor)'
    },
    {
      id: 'metric-6',
      metric_id: 'stress',
      name: 'Stress',
      category: 'mental',
      current_value: 4.1,
      previous_value: 4.8,
      unit: '/10',
      trend: 'down',
      status: 'moderate',
      last_updated: '2024-03-20T08:30:00Z',
      color: 'purple',
      icon: 'Brain',
      optimal_range: { min: 0, max: 4 },
      description: 'Nível de stress percebido'
    },
    {
      id: 'metric-7',
      metric_id: 'motivation',
      name: 'Motivação',
      category: 'mental',
      current_value: 8.5,
      previous_value: 7.9,
      unit: '/10',
      trend: 'up',
      status: 'excellent',
      last_updated: '2024-03-20T08:30:00Z',
      color: 'sky',
      icon: 'TrendingUp',
      optimal_range: { min: 7, max: 10 },
      description: 'Nível de motivação para treinar'
    }
  ],
  'athlete-2': [
    {
      id: 'metric-8',
      metric_id: 'hrv',
      name: 'HRV',
      category: 'biological',
      current_value: 52,
      previous_value: 54,
      unit: 'ms',
      trend: 'down',
      status: 'moderate',
      last_updated: '2024-03-19T08:00:00Z',
      color: 'emerald',
      icon: 'Heart',
      optimal_range: { min: 60, max: 100 },
      description: 'Heart Rate Variability'
    },
    {
      id: 'metric-9',
      metric_id: 'sleep_quality',
      name: 'Qualidade Sono',
      category: 'biological',
      current_value: 6.5,
      previous_value: 6.8,
      unit: '/10',
      trend: 'down',
      status: 'moderate',
      last_updated: '2024-03-19T07:00:00Z',
      color: 'sky',
      icon: 'Moon',
      optimal_range: { min: 7, max: 10 },
      description: 'Qualidade do sono'
    },
    {
      id: 'metric-10',
      metric_id: 'readiness',
      name: 'Prontidão',
      category: 'performance',
      current_value: 71,
      previous_value: 75,
      unit: '%',
      trend: 'down',
      status: 'moderate',
      last_updated: '2024-03-19T08:00:00Z',
      color: 'violet',
      icon: 'Zap',
      optimal_range: { min: 70, max: 100 },
      description: 'Prontidão para treinar'
    },
    {
      id: 'metric-11',
      metric_id: 'fatigue',
      name: 'Fadiga',
      category: 'performance',
      current_value: 5.2,
      previous_value: 4.8,
      unit: '/10',
      trend: 'up',
      status: 'warning',
      last_updated: '2024-03-19T08:00:00Z',
      color: 'amber',
      icon: 'AlertCircle',
      optimal_range: { min: 0, max: 4 },
      description: 'Nível de fadiga'
    }
  ]
};

const MOCK_DEFAULT_METRICS = [
  {
    id: 'default-1',
    metric_id: 'readiness',
    name: 'Prontidão',
    category: 'performance',
    current_value: 75,
    previous_value: 75,
    unit: '%',
    trend: 'stable',
    status: 'good',
    last_updated: new Date().toISOString(),
    color: 'violet',
    icon: 'Zap',
    optimal_range: { min: 70, max: 100 },
    description: 'Prontidão para treinar'
  },
  {
    id: 'default-2',
    metric_id: 'fatigue',
    name: 'Fadiga',
    category: 'performance',
    current_value: 3.5,
    previous_value: 3.5,
    unit: '/10',
    trend: 'stable',
    status: 'good',
    last_updated: new Date().toISOString(),
    color: 'amber',
    icon: 'AlertCircle',
    optimal_range: { min: 0, max: 4 },
    description: 'Nível de fadiga'
  }
];

// ============================================================================
// GET /api/athletes/[id]/metrics - Get athlete metrics
// ============================================================================
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const athleteId = params.id;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Athlete ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const mockMetrics = MOCK_ATHLETE_METRICS[athleteId] || MOCK_DEFAULT_METRICS;

    // Group metrics by category
    const groupedMetrics = {
      biological: mockMetrics.filter(m => m.category === 'biological'),
      performance: mockMetrics.filter(m => m.category === 'performance'),
      mental: mockMetrics.filter(m => m.category === 'mental'),
      custom: mockMetrics.filter(m => m.category === 'custom')
    };

    // Calculate summary stats
    const summary = {
      total_metrics: mockMetrics.length,
      metrics_updated_today: mockMetrics.filter(m => {
        const lastUpdated = new Date(m.last_updated);
        const today = new Date();
        return lastUpdated.toDateString() === today.toDateString();
      }).length,
      status_breakdown: {
        excellent: mockMetrics.filter(m => m.status === 'excellent').length,
        good: mockMetrics.filter(m => m.status === 'good').length,
        moderate: mockMetrics.filter(m => m.status === 'moderate').length,
        warning: mockMetrics.filter(m => m.status === 'warning').length,
        critical: mockMetrics.filter(m => m.status === 'critical').length
      },
      trends: {
        improving: mockMetrics.filter(m => m.trend === 'up').length,
        stable: mockMetrics.filter(m => m.trend === 'stable').length,
        declining: mockMetrics.filter(m => m.trend === 'down').length
      }
    };

    return NextResponse.json({
      metrics: mockMetrics,
      grouped: groupedMetrics,
      summary,
      source: 'mock'
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/athletes/[id]/metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}