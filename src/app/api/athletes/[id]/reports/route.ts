/**
 * Athlete Reports API Endpoint - FASE 4 ✅
 * 
 * GET /api/athletes/[id]/reports - Get athlete's available reports
 * 
 * Returns reports generated for the athlete:
 * - Performance reports
 * - Health summaries
 * - Progress reports
 * - Custom reports
 * 
 * @author PerformTrack Team
 * @since Fase 4 - 100% Completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ============================================================================
// MOCK REPORTS DATA - Used as fallback when DB is empty
// ============================================================================
const MOCK_ATHLETE_REPORTS: Record<string, any[]> = {
  'athlete-1': [
    {
      id: 'report-1',
      title: 'Análise Mensal - Março 2024',
      type: 'performance',
      created_at: '2024-03-01T10:00:00Z',
      created_by: 'Coach Silva',
      status: 'completed',
      summary: 'Excelente progresso no mês de Março. Aumento de 12% na força máxima e 8% na capacidade aeróbica.',
      metrics_included: ['strength', 'endurance', 'recovery'],
      file_url: null,
      insights: [
        'Força máxima: +12% vs Fevereiro',
        'VO2 Max estimado: 52ml/kg/min (+3%)',
        'Taxa de recuperação melhorou 15%',
        'Consistency score: 94%'
      ],
      recommendations: [
        'Manter volume atual de treino',
        'Adicionar trabalho de mobilidade',
        'Considerar taper para competição'
      ]
    },
    {
      id: 'report-2',
      title: 'Relatório de Saúde - Q1 2024',
      type: 'health',
      created_at: '2024-02-15T14:30:00Z',
      created_by: 'Dr. Costa',
      status: 'completed',
      summary: 'Estado de saúde geral excelente. Sem lesões significativas. Biomarcadores dentro dos parâmetros ideais.',
      metrics_included: ['hrv', 'sleep', 'recovery', 'injuries'],
      file_url: null,
      insights: [
        'HRV médio: 68ms (excelente)',
        'Qualidade de sono: 8.2/10',
        'Zero lesões ativas',
        'Stress autonómico controlado'
      ],
      recommendations: [
        'Continuar monitorização diária de HRV',
        'Manter rotina de sono',
        'Revisão em 3 meses'
      ]
    },
    {
      id: 'report-3',
      title: 'Progresso Trimestral - Q4 2023',
      type: 'progress',
      created_at: '2024-01-10T09:00:00Z',
      created_by: 'Coach Silva',
      status: 'completed',
      summary: 'Trimestre com crescimento consistente. Todos os objetivos atingidos ou superados.',
      metrics_included: ['all'],
      file_url: null,
      insights: [
        'Objetivos atingidos: 8/8 (100%)',
        'PRs estabelecidos: 12',
        'Attendance rate: 96%',
        'Melhoria geral: +18%'
      ],
      recommendations: [
        'Estabelecer novos objetivos para Q1',
        'Considerar aumento de intensidade',
        'Preparação para competição regional'
      ]
    },
    {
      id: 'report-4',
      title: 'Análise Biomecânica - Snatch',
      type: 'custom',
      created_at: '2023-12-20T16:00:00Z',
      created_by: 'Coach Técnico',
      status: 'completed',
      summary: 'Análise detalhada do movimento de Snatch. Identificadas áreas de melhoria na 2ª puxada.',
      metrics_included: ['technique', 'power'],
      file_url: null,
      insights: [
        'Posição inicial: Excelente',
        '1ª Puxada: Boa velocidade',
        '2ª Puxada: Timing a melhorar',
        'Receção: Estável e confiante'
      ],
      recommendations: [
        'Drills de timing para 2ª puxada',
        'Trabalho de força explosiva',
        'Vídeo análise semanal'
      ]
    }
  ],
  'athlete-2': [
    {
      id: 'report-5',
      title: 'Avaliação Inicial - Onboarding',
      type: 'assessment',
      created_at: '2023-06-01T10:00:00Z',
      created_by: 'Coach Silva',
      status: 'completed',
      summary: 'Avaliação inicial completa. Base sólida para progressão. Plano de treino de 12 semanas estabelecido.',
      metrics_included: ['strength', 'endurance', 'mobility'],
      file_url: null,
      insights: [
        'Nível atual: Intermediário',
        'Pontos fortes: Endurance cardiovascular',
        'A melhorar: Força máxima, mobilidade de anca',
        'Histórico: 2 anos de treino'
      ],
      recommendations: [
        'Programa de força 3x/semana',
        'Trabalho de mobilidade diário',
        'Reavaliação em 6 semanas'
      ]
    },
    {
      id: 'report-6',
      title: 'Progresso 6 Semanas',
      type: 'progress',
      created_at: '2023-07-15T11:00:00Z',
      created_by: 'Coach Silva',
      status: 'completed',
      summary: 'Excelente progresso nas primeiras 6 semanas. Aumento significativo de força e técnica.',
      metrics_included: ['strength', 'technique'],
      file_url: null,
      insights: [
        'Squat: +15kg',
        'Deadlift: +20kg',
        'Consistency: 94%',
        'Técnica melhorada: 35%'
      ],
      recommendations: [
        'Aumentar complexidade dos treinos',
        'Introduzir barbell cycling',
        'Continuar desenvolvimento de força'
      ]
    }
  ]
};

const MOCK_DEFAULT_REPORTS = [
  {
    id: 'report-default',
    title: 'Sem relatórios disponíveis',
    type: 'info',
    created_at: new Date().toISOString(),
    created_by: 'Sistema',
    status: 'pending',
    summary: 'Nenhum relatório foi gerado ainda para este atleta.',
    metrics_included: [],
    file_url: null,
    insights: [],
    recommendations: ['Aguardar geração do primeiro relatório']
  }
];

// ============================================================================
// GET /api/athletes/[id]/reports - Get athlete reports
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
    const reportType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = await createClient();

    // ============================================================================
    // TRY FETCH FROM DATABASE FIRST
    // ============================================================================
    const { data: reports, error } = await supabase
      .from('athlete_reports')
      .select(`
        id,
        title,
        type,
        status,
        summary,
        metrics_included,
        file_url,
        insights,
        recommendations,
        created_at,
        created_by:created_by_user_id (
          name,
          email
        )
      `)
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // If found in database, return real data
    if (!error && reports && reports.length > 0) {
      // Transform created_by from object to string
      const transformedReports = reports.map(r => ({
        ...r,
        created_by: r.created_by?.name || r.created_by?.email || 'Unknown'
      }));

      // Filter by type if specified
      let filteredReports = transformedReports;
      if (reportType && reportType !== 'all') {
        filteredReports = transformedReports.filter(r => r.type === reportType);
      }

      // Group by type
      const groupedReports = {
        performance: filteredReports.filter(r => r.type === 'performance'),
        health: filteredReports.filter(r => r.type === 'health'),
        progress: filteredReports.filter(r => r.type === 'progress'),
        custom: filteredReports.filter(r => r.type === 'custom'),
        assessment: filteredReports.filter(r => r.type === 'assessment')
      };

      // Calculate summary stats
      const summary = {
        total_reports: filteredReports.length,
        by_type: {
          performance: groupedReports.performance.length,
          health: groupedReports.health.length,
          progress: groupedReports.progress.length,
          custom: groupedReports.custom.length,
          assessment: groupedReports.assessment.length
        },
        last_report_date: filteredReports.length > 0 ? filteredReports[0].created_at : null,
        completed: filteredReports.filter(r => r.status === 'completed').length
      };

      return NextResponse.json({
        reports: filteredReports,
        grouped: groupedReports,
        summary,
        source: 'database'
      });
    }

    let mockReports = MOCK_ATHLETE_REPORTS[athleteId] || MOCK_DEFAULT_REPORTS;

    // Filter by type if specified
    if (reportType && reportType !== 'all') {
      mockReports = mockReports.filter(r => r.type === reportType);
    }

    // Apply limit
    mockReports = mockReports.slice(0, limit);

    // Group by type
    const groupedReports = {
      performance: mockReports.filter(r => r.type === 'performance'),
      health: mockReports.filter(r => r.type === 'health'),
      progress: mockReports.filter(r => r.type === 'progress'),
      custom: mockReports.filter(r => r.type === 'custom'),
      assessment: mockReports.filter(r => r.type === 'assessment')
    };

    // Calculate summary stats
    const summary = {
      total_reports: mockReports.length,
      by_type: {
        performance: groupedReports.performance.length,
        health: groupedReports.health.length,
        progress: groupedReports.progress.length,
        custom: groupedReports.custom.length,
        assessment: groupedReports.assessment.length
      },
      last_report_date: mockReports.length > 0 ? mockReports[0].created_at : null,
      completed: mockReports.filter(r => r.status === 'completed').length
    };

    return NextResponse.json({
      reports: mockReports,
      grouped: groupedReports,
      summary,
      source: 'mock'
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/athletes/[id]/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}