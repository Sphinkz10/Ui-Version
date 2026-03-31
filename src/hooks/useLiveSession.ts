/**
 * useLiveSession Hook - FASE 12 COMPLETE ✅
 * 
 * Hook para gerenciar sessões de treino em tempo real com auto-updates.
 * 
 * FEATURES:
 * - Real-time session tracking
 * - Auto-refresh every 5 seconds
 * - Live participant updates
 * - Exercise completion tracking
 * - Performance metrics updates
 * - Toast notifications for changes
 * 
 * Usage:
 * const { session, participants, progress, refresh } = useLiveSession({
 *   sessionId: 'session-123',
 *   autoRefresh: true,
 *   onUpdate: (session) => undefined,
 * });
 * 
 * @author PerformTrack Team
 * @since Fase 12 - Live Auto-Updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// TYPES
// ============================================================================

export interface LiveSession {
  id: string;
  templateId: string;
  templateName: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  location?: string;
  coachId: string;
  coachName: string;
  exercises: LiveExercise[];
  participants: LiveParticipant[];
  currentExerciseIndex: number;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveExercise {
  id: string;
  name: string;
  type: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  sets?: number;
  reps?: number;
  duration?: number;
  rest?: number;
}

export interface LiveParticipant {
  id: string;
  athleteId: string;
  athleteName: string;
  athletePhoto?: string;
  status: 'present' | 'absent' | 'late' | 'left';
  joinedAt?: string;
  leftAt?: string;
  completedExercises: number;
  totalExercises: number;
  currentExerciseId?: string;
  performanceScore?: number;
  notes?: string;
}

export interface UseLiveSessionOptions {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds (default: 5000 = 5s)
  onUpdate?: (session: LiveSession) => void;
  onParticipantJoin?: (participant: LiveParticipant) => void;
  onParticipantLeave?: (participant: LiveParticipant) => void;
  onExerciseComplete?: (exercise: LiveExercise) => void;
}

export interface UseLiveSessionReturn {
  session: LiveSession | null;
  participants: LiveParticipant[];
  exercises: LiveExercise[];
  progress: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startExercise: (exerciseId: string) => Promise<void>;
  completeExercise: (exerciseId: string) => Promise<void>;
  updateParticipantStatus: (participantId: string, status: LiveParticipant['status']) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useLiveSession(options: UseLiveSessionOptions): UseLiveSessionReturn {
  const {
    sessionId,
    autoRefresh = true,
    refreshInterval = 5000, // 5 seconds default
    onUpdate,
    onParticipantJoin,
    onParticipantLeave,
    onExerciseComplete,
  } = options;

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of previous state for comparison
  const prevSessionRef = useRef<LiveSession | null>(null);

  // Fetch session data
  const fetchSession = useCallback(async () => {
    try {
      setError(null);

      // In real app: const response = await fetch(`/api/sessions/${sessionId}/live`);
      // For now: use mock data
      const mockSession = getMockLiveSession(sessionId);
      
      // Check for changes and trigger callbacks ONLY if there's a previous session
      if (prevSessionRef.current) {
        const prev = prevSessionRef.current;
        
        // Detect new participants
        mockSession.participants.forEach(participant => {
          const wasPresent = prev.participants.some(p => p.id === participant.id);
          if (!wasPresent && onParticipantJoin) {
            onParticipantJoin(participant);
            toast.success(`${participant.athleteName} entrou na sessão`, {
              icon: '👋',
            });
          }
        });

        // Detect participants who left
        prev.participants.forEach(prevParticipant => {
          const stillPresent = mockSession.participants.some(p => p.id === prevParticipant.id);
          if (!stillPresent && onParticipantLeave) {
            onParticipantLeave(prevParticipant);
            toast.info(`${prevParticipant.athleteName} saiu da sessão`);
          }
        });

        // Detect completed exercises
        mockSession.exercises.forEach(exercise => {
          const prevExercise = prev.exercises.find(e => e.id === exercise.id);
          if (prevExercise?.status !== 'completed' && exercise.status === 'completed') {
            if (onExerciseComplete) {
              onExerciseComplete(exercise);
            }
            toast.success(`Exercício completado: ${exercise.name}`, {
              icon: '✅',
            });
          }
        });

        // Trigger general update callback
        if (onUpdate && JSON.stringify(prev) !== JSON.stringify(mockSession)) {
          onUpdate(mockSession);
        }
      }

      setSession(mockSession);
      prevSessionRef.current = mockSession;

    } catch (err) {
      console.error('Error fetching live session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [sessionId]); // REMOVED callbacks from dependencies to prevent infinite loops

  // Start an exercise
  const startExercise = useCallback(async (exerciseId: string) => {
    try {
      // In real app: await fetch(`/api/sessions/${sessionId}/exercises/${exerciseId}/start`, { method: 'POST' });
      
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map(ex => 
            ex.id === exerciseId 
              ? { ...ex, status: 'in_progress' as const, startedAt: new Date().toISOString() }
              : ex
          ),
        };
      });

      toast.info('Exercício iniciado', { icon: '▶️' });
      
    } catch (err) {
      toast.error('Erro ao iniciar exercício');
    }
  }, [sessionId]);

  // Complete an exercise
  const completeExercise = useCallback(async (exerciseId: string) => {
    try {
      // In real app: await fetch(`/api/sessions/${sessionId}/exercises/${exerciseId}/complete`, { method: 'POST' });
      
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map(ex => 
            ex.id === exerciseId 
              ? { ...ex, status: 'completed' as const, completedAt: new Date().toISOString() }
              : ex
          ),
          currentExerciseIndex: prev.currentExerciseIndex + 1,
        };
      });

      toast.success('Exercício completado!', { icon: '✅' });
      
    } catch (err) {
      toast.error('Erro ao completar exercício');
    }
  }, [sessionId]);

  // Update participant status
  const updateParticipantStatus = useCallback(async (
    participantId: string, 
    status: LiveParticipant['status']
  ) => {
    try {
      // In real app: await fetch(`/api/sessions/${sessionId}/participants/${participantId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          participants: prev.participants.map(p => 
            p.id === participantId 
              ? { ...p, status }
              : p
          ),
        };
      });

      toast.info('Status do atleta atualizado');
      
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSession();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSession]);

  return {
    session,
    participants: session?.participants || [],
    exercises: session?.exercises || [],
    progress: session?.completionPercentage || 0,
    loading,
    error,
    refresh: fetchSession,
    startExercise,
    completeExercise,
    updateParticipantStatus,
  };
}

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

function getMockLiveSession(sessionId: string): LiveSession {
  // Simulate real-time changes
  const now = new Date();
  const randomProgress = Math.min(100, Math.floor(Math.random() * 30) + 40);
  
  return {
    id: sessionId,
    templateId: 'template-strength-001',
    templateName: 'Treino de Força - Upper Body',
    status: 'in_progress',
    startTime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // Started 45 min ago
    duration: 90,
    location: 'Pavilhão Principal',
    coachId: 'coach-001',
    coachName: 'Treinador Silva',
    currentExerciseIndex: 2,
    completionPercentage: randomProgress,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: now.toISOString(),
    exercises: [
      {
        id: 'ex-001',
        name: 'Aquecimento Geral',
        type: 'warmup',
        order: 1,
        status: 'completed',
        startedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
        duration: 10,
      },
      {
        id: 'ex-002',
        name: 'Supino Reto',
        type: 'strength',
        order: 2,
        status: 'completed',
        sets: 4,
        reps: 10,
        rest: 90,
        startedAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
        completedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'ex-003',
        name: 'Remada Curvada',
        type: 'strength',
        order: 3,
        status: 'in_progress',
        sets: 4,
        reps: 10,
        rest: 90,
        startedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      },
      {
        id: 'ex-004',
        name: 'Desenvolvimento de Ombros',
        type: 'strength',
        order: 4,
        status: 'pending',
        sets: 3,
        reps: 12,
        rest: 60,
      },
      {
        id: 'ex-005',
        name: 'Bíceps Alternado',
        type: 'strength',
        order: 5,
        status: 'pending',
        sets: 3,
        reps: 15,
        rest: 60,
      },
      {
        id: 'ex-006',
        name: 'Alongamento Final',
        type: 'cooldown',
        order: 6,
        status: 'pending',
        duration: 10,
      },
    ],
    participants: [
      {
        id: 'part-001',
        athleteId: 'athlete-1',
        athleteName: 'João Silva',
        athletePhoto: 'https://i.pravatar.cc/150?img=12',
        status: 'present',
        joinedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        completedExercises: 2,
        totalExercises: 6,
        currentExerciseId: 'ex-003',
        performanceScore: 8.5,
      },
      {
        id: 'part-002',
        athleteId: 'athlete-2',
        athleteName: 'Maria Santos',
        athletePhoto: 'https://i.pravatar.cc/150?img=45',
        status: 'present',
        joinedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        completedExercises: 2,
        totalExercises: 6,
        currentExerciseId: 'ex-003',
        performanceScore: 9.2,
      },
      {
        id: 'part-003',
        athleteId: 'athlete-3',
        athleteName: 'Pedro Costa',
        athletePhoto: 'https://i.pravatar.cc/150?img=33',
        status: 'late',
        joinedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        completedExercises: 1,
        totalExercises: 6,
        currentExerciseId: 'ex-003',
        performanceScore: 7.8,
        notes: 'Chegou 15 min atrasado',
      },
    ],
  };
}