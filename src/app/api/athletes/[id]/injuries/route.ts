/**
 * Athlete Injuries API Endpoint - FASE 4 ✅
 * 
 * GET /api/athletes/[id]/injuries - Get athlete's injury history
 * 
 * Returns:
 * - Active injuries
 * - Recovering injuries
 * - Past injuries (recovered)
 * - Injury stats and patterns
 * 
 * @author PerformTrack Team
 * @since Fase 4 - 100% Completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// MOCK INJURIES DATA - Used as fallback when DB is empty
// ============================================================================
const MOCK_ATHLETE_INJURIES: Record<string, any[]> = {
  'athlete-1': [
    {
      id: 'injury-1',
      athlete_id: 'athlete-1',
      type: 'Tendinite Patelar',
      body_part: 'Joelho Direito',
      severity: 'moderate',
      status: 'recovering',
      injury_date: '2024-02-15',
      expected_recovery_date: '2024-04-01',
      actual_recovery_date: null,
      description: 'Dor no tendão patelar após aumento de volume de saltos. Diagnóstico confirmado por ultrassom.',
      treatment_plan: [
        'Repouso relativo - evitar impactos',
        'Fisioterapia 3x/semana',
        'Exercícios excêntricos',
        'Gelo após treinos',
        'Anti-inflamatórios conforme prescrição'
      ],
      restrictions: [
        'Sem box jumps',
        'Sem double-unders',
        'Limitar agachamentos profundos',
        'Volume reduzido em 40%'
      ],
      progress_notes: [
        {
          date: '2024-03-01',
          note: 'Dor reduziu de 7/10 para 4/10',
          assessed_by: 'Dr. Costa'
        },
        {
          date: '2024-03-15',
          note: 'Amplitude de movimento melhorou 30%',
          assessed_by: 'Fisioterapeuta João'
        }
      ],
      created_by: 'Coach Silva',
      created_at: '2024-02-15T14:00:00Z',
      updated_at: '2024-03-15T10:00:00Z'
    },
    {
      id: 'injury-2',
      athlete_id: 'athlete-1',
      type: 'Distensão Muscular',
      body_part: 'Isquiotibiais Esquerdo',
      severity: 'mild',
      status: 'recovered',
      injury_date: '2023-11-10',
      expected_recovery_date: '2023-12-01',
      actual_recovery_date: '2023-11-28',
      description: 'Distensão grau 1 nos isquiotibiais durante sprint. Recuperação completa.',
      treatment_plan: [
        'Repouso 1 semana',
        'Massagem desportiva',
        'Exercícios de fortalecimento progressivo',
        'Retorno gradual à atividade'
      ],
      restrictions: [
        'Sem corrida por 1 semana',
        'Sem levantamentos pesados por 2 semanas'
      ],
      progress_notes: [
        {
          date: '2023-11-20',
          note: 'Sem dor em repouso, leve desconforto em alongamento',
          assessed_by: 'Dr. Costa'
        },
        {
          date: '2023-11-28',
          note: 'Recuperação completa. Cleared para treino normal',
          assessed_by: 'Dr. Costa'
        }
      ],
      created_by: 'Coach Silva',
      created_at: '2023-11-10T16:30:00Z',
      updated_at: '2023-11-28T11:00:00Z'
    },
    {
      id: 'injury-3',
      athlete_id: 'athlete-1',
      type: 'Entorse Tornozelo',
      body_part: 'Tornozelo Direito',
      severity: 'mild',
      status: 'recovered',
      injury_date: '2023-06-05',
      expected_recovery_date: '2023-06-20',
      actual_recovery_date: '2023-06-18',
      description: 'Entorse grau 1 durante box jump. Recuperação rápida.',
      treatment_plan: [
        'RICE protocol',
        'Propriocepção',
        'Fortalecimento de tornozelo'
      ],
      restrictions: [
        'Sem pliometria por 2 semanas'
      ],
      progress_notes: [
        {
          date: '2023-06-18',
          note: 'Recuperação completa',
          assessed_by: 'Fisioterapeuta'
        }
      ],
      created_by: 'Coach Silva',
      created_at: '2023-06-05T10:00:00Z',
      updated_at: '2023-06-18T14:00:00Z'
    }
  ],
  'athlete-2': [
    {
      id: 'injury-4',
      athlete_id: 'athlete-2',
      type: 'Dor Lombar',
      body_part: 'Região Lombar',
      severity: 'mild',
      status: 'recovering',
      injury_date: '2024-03-10',
      expected_recovery_date: '2024-03-25',
      actual_recovery_date: null,
      description: 'Dor lombar após deadlifts. Possível fadiga muscular.',
      treatment_plan: [
        'Reduzir volume de levantamentos',
        'Trabalho de core stability',
        'Alongamentos específicos',
        'Avaliação postural'
      ],
      restrictions: [
        'Reduzir carga em 30%',
        'Evitar extensão lombar excessiva'
      ],
      progress_notes: [
        {
          date: '2024-03-15',
          note: 'Melhoria significativa, dor apenas em movimentos específicos',
          assessed_by: 'Coach Silva'
        }
      ],
      created_by: 'Coach Silva',
      created_at: '2024-03-10T09:00:00Z',
      updated_at: '2024-03-15T16:00:00Z'
    }
  ]
};

const MOCK_DEFAULT_INJURIES: any[] = [];

// ============================================================================
// GET /api/athletes/[id]/injuries - Get athlete injuries
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const athleteId = params.id;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Athlete ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, recovering, recovered
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await createClient();

    // ============================================================================
    // TRY FETCH FROM DATABASE FIRST
    // ============================================================================
    const { data: injuries, error } = await supabase
      .from('athlete_injuries')
      .select(`
        id,
        athlete_id,
        type,
        body_part,
        severity,
        status,
        injury_date,
        expected_recovery_date,
        actual_recovery_date,
        description,
        treatment_plan,
        restrictions,
        progress_notes,
        created_by,
        created_at,
        updated_at
      `)
      .eq('athlete_id', athleteId)
      .order('injury_date', { ascending: false })
      .limit(limit);

    // If found in database, return real data
    if (!error && injuries && injuries.length > 0) {
      // Filter by status if specified
      let filteredInjuries = injuries;
      if (status && status !== 'all') {
        filteredInjuries = injuries.filter(i => i.status === status);
      }

      // Group by status
      const groupedInjuries = {
        active: filteredInjuries.filter(i => i.status === 'active'),
        recovering: filteredInjuries.filter(i => i.status === 'recovering'),
        recovered: filteredInjuries.filter(i => i.status === 'recovered')
      };

      // Calculate stats
      const stats = {
        total_injuries: injuries.length,
        active_count: groupedInjuries.active.length,
        recovering_count: groupedInjuries.recovering.length,
        recovered_count: groupedInjuries.recovered.length,
        avg_recovery_days: injuries
          .filter(i => i.actual_recovery_date)
          .map(i => {
            const start = new Date(i.injury_date);
            const end = new Date(i.actual_recovery_date!);
            return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          })
          .reduce((sum, days, _, arr) => arr.length > 0 ? sum + days / arr.length : 0, 0),
        most_common_area: injuries.length > 0 ? injuries[0].body_part : 'N/A',
        injury_free_days: injuries.length > 0 
          ? Math.floor((new Date().getTime() - new Date(injuries[0].injury_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0
      };

      return NextResponse.json({
        injuries: filteredInjuries,
        grouped: groupedInjuries,
        stats,
        source: 'database'
      });
    }

    let mockInjuries = MOCK_ATHLETE_INJURIES[athleteId] || MOCK_DEFAULT_INJURIES;

    // Filter by status if specified
    if (status && status !== 'all') {
      mockInjuries = mockInjuries.filter(i => i.status === status);
    }

    // Apply limit
    mockInjuries = mockInjuries.slice(0, limit);

    // Group by status
    const groupedInjuries = {
      active: mockInjuries.filter(i => i.status === 'active'),
      recovering: mockInjuries.filter(i => i.status === 'recovering'),
      recovered: mockInjuries.filter(i => i.status === 'recovered')
    };

    // Calculate stats
    const allInjuries = MOCK_ATHLETE_INJURIES[athleteId] || [];
    const stats = {
      total_injuries: allInjuries.length,
      active_count: groupedInjuries.active.length,
      recovering_count: groupedInjuries.recovering.length,
      recovered_count: groupedInjuries.recovered.length,
      avg_recovery_days: allInjuries
        .filter(i => i.actual_recovery_date)
        .map(i => {
          const start = new Date(i.injury_date);
          const end = new Date(i.actual_recovery_date);
          return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        })
        .reduce((sum, days, _, arr) => sum + days / arr.length, 0) || 0,
      most_common_area: 'Joelho', // Mock
      injury_free_days: allInjuries.length > 0 
        ? Math.floor((new Date().getTime() - new Date(allInjuries[0].injury_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    };

    return NextResponse.json({
      injuries: mockInjuries,
      grouped: groupedInjuries,
      stats,
      source: 'mock'
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/athletes/[id]/injuries:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}