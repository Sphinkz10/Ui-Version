import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const athleteId = params.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const generateHistory = (metricId: string, baseValue: number, variation: number) => {
      const data = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const value = baseValue + (Math.random() * variation * 2 - variation);
        
        data.push({
          date: date.toISOString(),
          value: Math.round(value * 10) / 10,
          zone: value > baseValue + variation / 2 ? 'green' : value < baseValue - variation / 2 ? 'red' : 'yellow',
          notes: null
        });
      }
      return data;
    };

    const metrics = [
      {
        metric_id: 'readiness',
        metric_name: 'Readiness Score',
        unit: '%',
        category: 'wellness',
        data: generateHistory('readiness', 85, 10)
      },
      {
        metric_id: 'training_load',
        metric_name: 'Training Load',
        unit: 'AU',
        category: 'performance',
        data: generateHistory('training_load', 450, 100)
      },
      {
        metric_id: 'stress',
        metric_name: 'Stress Level',
        unit: 'score',
        category: 'wellness',
        data: generateHistory('stress', 5, 2)
      },
      {
        metric_id: 'hrv',
        metric_name: 'HRV',
        unit: 'ms',
        category: 'recovery',
        data: generateHistory('hrv', 75, 10)
      },
      {
        metric_id: 'sleep',
        metric_name: 'Sleep Quality',
        unit: 'score',
        category: 'recovery',
        data: generateHistory('sleep', 7.5, 1.5)
      },
      {
        metric_id: 'weight',
        metric_name: 'Weight',
        unit: 'kg',
        category: 'body_comp',
        data: generateHistory('weight', 75.5, 0.5)
      },
      {
        metric_id: 'body_fat',
        metric_name: 'Body Fat',
        unit: '%',
        category: 'body_comp',
        data: generateHistory('body_fat', 12.5, 0.3)
      }
    ];

    const response = {
      athlete_id: athleteId,
      date_range: {
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        days
      },
      metrics,
      total_updates: metrics.reduce((sum, m) => sum + m.data.length, 0)
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error in metrics history API:', error);
    
    return NextResponse.json(
      {
        athlete_id: 'unknown',
        date_range: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          days: 0
        },
        metrics: [],
        total_updates: 0
      },
      { status: 200 }
    );
  }
}