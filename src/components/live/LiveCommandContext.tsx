import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import type { 
  LiveSessionConfig, 
  LiveWorkout, 
  LiveSessionState, 
  LiveCommandContextValue,
  LiveAthlete,
  ExecutedSet,
  SessionSnapshot,
  SessionModification,
  SessionNote
} from './types';

const LiveCommandContext = createContext<LiveCommandContextValue | null>(null);

export function LiveCommandProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LiveSessionState | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  // Timer effect
  useEffect(() => {
    if (session?.status === 'active') {
      const interval = setInterval(() => {
        setSession(prev => {
          if (!prev || prev.status !== 'active') return prev;
          
          const now = Date.now();
          const started = prev.timestamps.started?.getTime() || now;
          const elapsed = now - started;
          
          return {
            ...prev,
            timer: {
              ...prev.timer,
              elapsed,
              active: elapsed - prev.timer.pauses
            }
          };
        });
      }, 1000);
      
      setTimerInterval(interval);
      
      return () => clearInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [session?.status]);

  const startSession = useCallback(async (config: LiveSessionConfig, workout: LiveWorkout) => {
    // Buscar histórico dos atletas
    const athletesWithHistory = await Promise.all(
      config.calendarEvent.athleteIds.map(async (athleteId) => {
        // TODO: Buscar do backend
        const athlete = {
          id: athleteId,
          name: `Atleta ${athleteId}`,
          email: `atleta${athleteId}@example.com`,
          attendance: 'present' as const,
          currentExerciseIndex: 0,
          currentSetNumber: 1,
          sessionStats: {
            setsCompleted: 0,
            totalVolume: 0,
            totalReps: 0,
            averageRPE: 0
          }
        };
        
        return athlete;
      })
    );

    // Try to create session in backend (but don't block if fails)
    let backendSessionId: string | null = null;
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: config.workspaceId,
          calendarEventId: config.calendarEvent.id,
          workoutId: workout.id || null,
          coachId: config.coachId,
          athleteIds: config.calendarEvent.athleteIds,
          startedAt: new Date().toISOString(),
          plannedWorkout: workout,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        backendSessionId = result.session.id;
        console.log('✅ Session created in backend:', backendSessionId);
      } else {
        // Silently fail - log but don't show error to user
        console.warn('⚠️ Backend session creation failed (offline mode)');
      }
    } catch (error) {
      // Silently fail - session works locally
      console.warn('⚠️ Backend unavailable (offline mode):', error);
    }

    const newSession: LiveSessionState = {
      config: {
        ...config,
        sessionId: backendSessionId || config.sessionId, // Use backend ID if created
      },
      workout: {
        ...workout,
        exercises: workout.exercises.map(ex => ({
          ...ex,
          status: 'pending' as const,
          athleteData: {}
        }))
      },
      currentExerciseIndex: 0,
      athletes: athletesWithHistory,
      status: 'active',
      timestamps: {
        scheduled: config.calendarEvent.startDate,
        started: new Date()
      },
      timer: {
        elapsed: 0,
        active: 0,
        pauses: 0
      },
      modifications: [],
      notes: []
    };

    // Marcar primeiro exercício como ativo
    newSession.workout.exercises[0].status = 'active';
    newSession.workout.exercises[0].startedAt = new Date();

    setSession(newSession);
    toast.success('Sessão iniciada!', {
      description: `Treino: ${workout.name}`
    });
  }, []);

  const pauseSession = useCallback(() => {
    setSession(prev => {
      if (!prev || prev.status !== 'active') return prev;
      
      return {
        ...prev,
        status: 'paused',
        timestamps: {
          ...prev.timestamps,
          pausedAt: new Date()
        }
      };
    });
    
    toast.info('Sessão pausada');
  }, []);

  const resumeSession = useCallback(() => {
    setSession(prev => {
      if (!prev || prev.status !== 'paused') return prev;
      
      const pauseDuration = prev.timestamps.pausedAt 
        ? Date.now() - prev.timestamps.pausedAt.getTime()
        : 0;
      
      return {
        ...prev,
        status: 'active',
        timestamps: {
          ...prev.timestamps,
          resumedAt: new Date(),
          pausedAt: undefined
        },
        timer: {
          ...prev.timer,
          pauses: prev.timer.pauses + pauseDuration
        }
      };
    });
    
    toast.success('Sessão retomada');
  }, []);

  const completeSession = useCallback(async (): Promise<SessionSnapshot> => {
    if (!session) throw new Error('Nenhuma sessão ativa');

    const completedAt = new Date();
    const totalDuration = completedAt.getTime() - (session.timestamps.started?.getTime() || 0);
    const activeDuration = totalDuration - session.timer.pauses;

    // Calcular analytics
    const allSets = session.athletes.flatMap(athlete =>
      Object.values(session.workout.exercises.flatMap(ex => ex.athleteData[athlete.id] || []))
    );

    const volumeTotal = allSets.reduce((sum, set) => 
      sum + ((set.reps || 0) * (set.weight || 0)), 0
    );

    const repsTotal = allSets.reduce((sum, set) => sum + (set.reps || 0), 0);
    const setsTotal = allSets.filter(s => s.completed).length;
    
    const rpeSets = allSets.filter(s => s.rpe !== undefined);
    const intensityAverage = rpeSets.length > 0
      ? rpeSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / rpeSets.length
      : 0;

    const totalPlannedSets = session.workout.exercises.reduce(
      (sum, ex) => sum + ex.planned.sets * session.athletes.length, 0
    );
    const complianceRate = (setsTotal / totalPlannedSets) * 100;

    // Criar snapshot
    const snapshot: SessionSnapshot = {
      id: `snapshot_${Date.now()}_${crypto.randomUUID()}`,
      version: '1.0',
      immutable: true,
      sessionId: session.config.sessionId,
      calendarEventId: session.config.calendarEvent.id,
      workoutId: session.workout.id,
      coachId: session.config.coachId,
      
      plannedWorkout: session.workout,
      
      executedWorkout: {
        exercises: session.workout.exercises,
        actualDuration: totalDuration,
        actualIntensity: intensityAverage
      },
      
      athletes: session.athletes.map(athlete => ({
        athleteId: athlete.id,
        name: athlete.name,
        attendance: athlete.attendance,
        arrivalTime: athlete.arrivalTime,
        performanceData: athlete.sessionStats,
        personalRecords: [] // Will be detected by backend
      })),
      
      timestamps: {
        scheduled: session.timestamps.scheduled || new Date(),
        started: session.timestamps.started || new Date(),
        ended: completedAt,
        pauseDurations: [session.timer.pauses],
        totalDuration,
        activeDuration
      },
      
      modifications: session.modifications,
      notes: session.notes,
      
      analytics: {
        volumeTotal,
        repsTotal,
        setsTotal,
        intensityAverage,
        complianceRate,
        byExercise: {},
        comparisons: {}
      },
      
      createdAt: new Date(),
      snapshotHash: generateSnapshotHash()
    };

    // ============================================================
    // CRITICAL: Save to backend via API
    // ============================================================
    try {
      const response = await fetch(`/api/sessions/${session.config.sessionId}/snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snapshotData: {
            version: snapshot.version,
            immutable: true,
            sessionId: snapshot.sessionId,
            plannedWorkout: snapshot.plannedWorkout,
            executedWorkout: snapshot.executedWorkout,
            athletes: snapshot.athletes,
            modifications: snapshot.modifications,
            notes: snapshot.notes,
            analytics: snapshot.analytics,
          },
          completedAt: completedAt.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to save session snapshot:', errorData);
        toast.error('Erro ao salvar sessão', {
          description: errorData.error || 'Falha ao comunicar com servidor'
        });
        throw new Error(errorData.error || 'Failed to save snapshot');
      }

      const result = await response.json();
      console.log('✅ Session snapshot saved successfully:', result);
      
      // Show success with stats
      toast.success('Sessão concluída e salva!', {
        description: `${setsTotal} sets | ${result.stats.metricUpdatesCreated} métricas | ${result.stats.recordSuggestionsCreated} PRs sugeridos`
      });

    } catch (error: any) {
      console.error('❌ CRITICAL: Failed to save session snapshot:', error);
      toast.error('Erro crítico ao salvar sessão', {
        description: 'Os dados estão em memória mas não foram salvos. Contacte suporte.'
      });
      // Don't throw - allow snapshot to return so data isn't lost
    }

    // Atualizar sessão local
    setSession(prev => prev ? {
      ...prev,
      status: 'completed',
      timestamps: {
        ...prev.timestamps,
        completedAt
      }
    } : null);

    return snapshot;
  }, [session]);

  const nextExercise = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      
      const currentIndex = prev.currentExerciseIndex;
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= prev.workout.exercises.length) {
        toast.info('Último exercício!');
        return prev;
      }
      
      // Marcar atual como completo
      const updatedExercises = [...prev.workout.exercises];
      updatedExercises[currentIndex].status = 'completed';
      updatedExercises[currentIndex].completedAt = new Date();
      
      // Marcar próximo como ativo
      updatedExercises[nextIndex].status = 'active';
      updatedExercises[nextIndex].startedAt = new Date();
      
      return {
        ...prev,
        currentExerciseIndex: nextIndex,
        workout: {
          ...prev.workout,
          exercises: updatedExercises
        }
      };
    });
  }, []);

  const previousExercise = useCallback(() => {
    setSession(prev => {
      if (!prev || prev.currentExerciseIndex === 0) return prev;
      
      const prevIndex = prev.currentExerciseIndex - 1;
      
      const updatedExercises = [...prev.workout.exercises];
      updatedExercises[prev.currentExerciseIndex].status = 'pending';
      updatedExercises[prevIndex].status = 'active';
      
      return {
        ...prev,
        currentExerciseIndex: prevIndex,
        workout: {
          ...prev.workout,
          exercises: updatedExercises
        }
      };
    });
  }, []);

  const goToExercise = useCallback((index: number) => {
    setSession(prev => {
      if (!prev || index < 0 || index >= prev.workout.exercises.length) return prev;
      
      const updatedExercises = [...prev.workout.exercises];
      updatedExercises[prev.currentExerciseIndex].status = 'pending';
      updatedExercises[index].status = 'active';
      
      return {
        ...prev,
        currentExerciseIndex: index,
        workout: {
          ...prev.workout,
          exercises: updatedExercises
        }
      };
    });
  }, []);

  const recordSet = useCallback((
    athleteId: string,
    exerciseId: string,
    setData: Omit<ExecutedSet, 'setNumber' | 'timestamp'>
  ) => {
    setSession(prev => {
      if (!prev) return prev;
      
      const athlete = prev.athletes.find(a => a.id === athleteId);
      const exerciseIndex = prev.workout.exercises.findIndex(e => e.id === exerciseId);
      
      if (!athlete || exerciseIndex === -1) return prev;
      
      const exercise = prev.workout.exercises[exerciseIndex];
      const existingSets = exercise.athleteData[athleteId] || [];
      
      const newSet: ExecutedSet = {
        ...setData,
        setNumber: existingSets.length + 1,
        timestamp: new Date()
      };
      
      // Atualizar exercício
      const updatedExercises = [...prev.workout.exercises];
      updatedExercises[exerciseIndex] = {
        ...exercise,
        athleteData: {
          ...exercise.athleteData,
          [athleteId]: [...existingSets, newSet]
        }
      };
      
      // Atualizar stats do atleta
      const updatedAthletes = prev.athletes.map(a => {
        if (a.id !== athleteId) return a;
        
        const volume = (newSet.reps || 0) * (newSet.weight || 0);
        
        return {
          ...a,
          sessionStats: {
            setsCompleted: a.sessionStats.setsCompleted + 1,
            totalVolume: a.sessionStats.totalVolume + volume,
            totalReps: a.sessionStats.totalReps + (newSet.reps || 0),
            averageRPE: newSet.rpe
              ? (a.sessionStats.averageRPE * a.sessionStats.setsCompleted + newSet.rpe) / (a.sessionStats.setsCompleted + 1)
              : a.sessionStats.averageRPE
          }
        };
      });
      
      return {
        ...prev,
        workout: {
          ...prev.workout,
          exercises: updatedExercises
        },
        athletes: updatedAthletes
      };
    });
    
    toast.success('Set registrado!');
  }, []);

  const skipExercise = useCallback((exerciseId: string, reason?: string) => {
    setSession(prev => {
      if (!prev) return prev;
      
      const exerciseIndex = prev.workout.exercises.findIndex(e => e.id === exerciseId);
      if (exerciseIndex === -1) return prev;
      
      const updatedExercises = [...prev.workout.exercises];
      updatedExercises[exerciseIndex].status = 'skipped';
      
      const modification: SessionModification = {
        id: `mod_${Date.now()}`,
        type: 'exercise_skipped',
        timestamp: new Date(),
        exerciseId,
        reason
      };
      
      return {
        ...prev,
        workout: {
          ...prev.workout,
          exercises: updatedExercises
        },
        modifications: [...prev.modifications, modification]
      };
    });
    
    toast.info('Exercício pulado');
  }, []);

  const substituteExercise = useCallback((exerciseId: string, newExerciseId: string, reason?: string) => {
    // TODO: Implementar substituição
    toast.info('Exercício substituído');
  }, []);

  const adjustExercise = useCallback((exerciseId: string, adjustments: any) => {
    setSession(prev => {
      if (!prev) return prev;
      
      const exerciseIndex = prev.workout.exercises.findIndex(e => e.id === exerciseId);
      if (exerciseIndex === -1) return prev;
      
      const updatedExercises = [...prev.workout.exercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        planned: {
          ...updatedExercises[exerciseIndex].planned,
          ...adjustments
        }
      };
      
      return {
        ...prev,
        workout: {
          ...prev.workout,
          exercises: updatedExercises
        }
      };
    });
    
    toast.success('Exercício ajustado');
  }, []);

  const addNote = useCallback((note: Omit<SessionNote, 'id' | 'timestamp'>) => {
    setSession(prev => {
      if (!prev) return prev;
      
      const newNote: SessionNote = {
        ...note,
        id: `note_${Date.now()}`,
        timestamp: new Date()
      };
      
      return {
        ...prev,
        notes: [...prev.notes, newNote]
      };
    });
    
    toast.success('Nota adicionada');
  }, []);

  const updateAthleteAttendance = useCallback((athleteId: string, attendance: LiveAthlete['attendance']) => {
    setSession(prev => {
      if (!prev) return prev;
      
      const updatedAthletes = prev.athletes.map(a =>
        a.id === athleteId
          ? { ...a, attendance, arrivalTime: attendance === 'late' ? new Date() : a.arrivalTime }
          : a
      );
      
      return {
        ...prev,
        athletes: updatedAthletes
      };
    });
  }, []);

  const value: LiveCommandContextValue = {
    session,
    isActive: session?.status === 'active' || session?.status === 'paused',
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    nextExercise,
    previousExercise,
    goToExercise,
    recordSet,
    skipExercise,
    substituteExercise,
    adjustExercise,
    addNote,
    updateAthleteAttendance
  };

  return (
    <LiveCommandContext.Provider value={value}>
      {children}
    </LiveCommandContext.Provider>
  );
}

export function useLiveCommand() {
  const context = useContext(LiveCommandContext);
  if (!context) {
    throw new Error('useLiveCommand must be used within LiveCommandProvider');
  }
  return context;
}

function generateSnapshotHash(): string {
  return `hash_${Date.now()}_${crypto.randomUUID()}`;
}