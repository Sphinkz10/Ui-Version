/**
 * Analytics Alerts API - FASE 5 ENTERPRISE FEATURES
 * 
 * GET /api/analytics/alerts
 * Returns all dashboard alerts.
 * 
 * Query params:
 * - workspaceId: string (required)
 * - types?: string (comma-separated) - filter alert types
 * 
 * @author PerformTrack Team
 * @since Fase 5 - Enterprise Features
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// GET /api/analytics/alerts - Get dashboard alerts
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const types = searchParams.get('types');

    // Validate
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const mockAlerts = {
      pain: [
        {
          id: 'pain-1',
          athleteId: 'athlete-1',
          athleteName: 'João Silva',
          athleteAvatar: 'https://i.pravatar.cc/150?img=12',
          submissionId: 'sub-1',
          painLevel: 8,
          location: 'joelho direito',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          timeAgo: 'há 15min',
        },
        {
          id: 'pain-2',
          athleteId: 'athlete-2',
          athleteName: 'Maria Santos',
          athleteAvatar: 'https://i.pravatar.cc/150?img=45',
          submissionId: 'sub-2',
          painLevel: 9,
          location: 'lombar',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          timeAgo: 'há 2h',
        },
        {
          id: 'pain-3',
          athleteId: 'athlete-3',
          athleteName: 'Pedro Costa',
          athleteAvatar: 'https://i.pravatar.cc/150?img=33',
          submissionId: 'sub-3',
          painLevel: 8,
          location: 'ombro esquerdo',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          timeAgo: 'há 6h',
        },
      ],
      orphanSessions: [
        {
          id: 'orphan-1',
          sessionId: 'session-orphan-1',
          title: 'Treino de Recuperação',
          athleteCount: 5,
          startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          hoursActive: 3,
        },
      ],
      pendingForms: [
        {
          id: 'form-1',
          formId: 'wellness-form-1',
          formName: 'Wellness Check',
          pendingCount: 8,
          athleteNames: ['Ana Rodrigues', 'Carlos Ferreira', 'Daniela Lima'],
        },
      ],
      pendingAssessments: [
        {
          id: 'assess-1',
          athleteId: 'athlete-4',
          athleteName: 'Carlos Ferreira',
          athleteAvatar: 'https://i.pravatar.cc/150?img=51',
          lastAssessmentDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
          daysSince: 65,
        },
        {
          id: 'assess-2',
          athleteId: 'athlete-5',
          athleteName: 'Rita Almeida',
          athleteAvatar: 'https://i.pravatar.cc/150?img=25',
          lastAssessmentDate: null,
          daysSince: null,
        },
      ],
      metricsThreshold: [
        {
          id: 'metric-1',
          athleteId: 'athlete-6',
          athleteName: 'Bruno Tavares',
          athleteAvatar: 'https://i.pravatar.cc/150?img=8',
          metricName: 'Frequência Cardíaca em Repouso',
          value: 95,
          unit: 'bpm',
          thresholdMin: 50,
          thresholdMax: 70,
          recordedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          timeAgo: 'há 1h',
        },
      ],
      personalRecords: [
        {
          id: 'pr-1',
          athleteId: 'athlete-7',
          athleteName: 'Sofia Mendes',
          athleteAvatar: 'https://i.pravatar.cc/150?img=47',
          metricName: 'Squat 1RM',
          newValue: 120,
          previousValue: 110,
          unit: 'kg',
          sourceType: 'session',
          sourceId: 'session-123',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          timeAgo: 'há 30min',
        },
      ],
      webhookFailures: [],
      summary: {
        critical: 3,
        high: 2,
        medium: 3,
        total: 8,
      },
    };

    return NextResponse.json({
      alerts: mockAlerts,
      mock: true,
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/analytics/alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
