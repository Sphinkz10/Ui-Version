/**
 * useStartLiveSession Hook - FASE 3 CALENDAR INTEGRATION
 * 
 * Hook para iniciar uma Live Session a partir de um calendar event.
 * 
 * Usage:
 * ```tsx
 * const { startFromEvent, isStarting, error } = useStartLiveSession();
 * 
 * const handleStart = async () => {
 *   const result = await startFromEvent(eventId, coachId, workspaceId);
 *   if (result.success) {
 *     // Navigate to live session page
 *     router.push(`/live/${result.session.id}`);
 *   }
 * };
 * ```
 * 
 * @author PerformTrack Team
 * @since Fase 3 - Calendar Integration
 */

import { useState, useCallback } from 'react';
import { useLiveCommand } from '@/components/live/LiveCommandContext';
import type { LiveWorkout } from '@/components/live/types';

export interface StartSessionResult {
  success: boolean;
  session?: {
    id: string;
    status: string;
  };
  event?: {
    id: string;
    title: string;
  };
  workout?: any;
  athletes?: any[];
  error?: string;
}

export interface UseStartLiveSessionReturn {
  startFromEvent: (
    eventId: string,
    coachId: string,
    workspaceId: string
  ) => Promise<StartSessionResult>;
  isStarting: boolean;
  error: string | null;
  result: StartSessionResult | null;
  reset: () => void;
}

export function useStartLiveSession(): UseStartLiveSessionReturn {
  const { startSession } = useLiveCommand();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartSessionResult | null>(null);

  const startFromEvent = useCallback(async (
    eventId: string,
    coachId: string,
    workspaceId: string
  ): Promise<StartSessionResult> => {
    setIsStarting(true);
    setError(null);
    setResult(null);

    try {
      // Call start API endpoint
      const response = await fetch(`/api/calendar-events/${eventId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coachId,
          workspaceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start session');
      }

      const data = await response.json();

      // Transform backend data to LiveCommandContext format
      const liveWorkout: LiveWorkout = {
        id: data.workout.id,
        name: data.workout.name,
        description: data.workout.description || '',
        estimatedDuration: data.workout.estimated_duration_minutes || 60,
        intensity: 7, // Default
        exercises: data.workout.exercises.map((ex: any) => ({
          id: ex.exerciseId,
          name: ex.exerciseName,
          description: ex.exerciseDescription || '',
          videoUrl: ex.demoVideoUrl,
          planned: {
            sets: ex.plannedSets || 3,
            reps: ex.plannedReps || 10,
            weight: parseFloat(ex.plannedLoad) || undefined,
            rest: ex.plannedRestSeconds || 90,
            notes: ex.coachingCues || '',
          },
          status: 'pending' as const,
          athleteData: {},
        })),
      };

      // Initialize LiveCommandContext
      await startSession(
        {
          sessionId: data.session.id,
          workspaceId,
          calendarEvent: {
            id: data.event.id,
            title: data.event.title,
            description: data.event.description || '',
            startDate: new Date(data.event.startDate),
            endDate: new Date(data.event.endDate),
            type: 'workout',
            status: 'active',
            athleteIds: data.athletes.map((a: any) => a.id),
            location: data.event.location,
          },
          coachId,
        },
        liveWorkout
      );

      const successResult: StartSessionResult = {
        success: true,
        session: data.session,
        event: data.event,
        workout: data.workout,
        athletes: data.athletes,
      };

      setResult(successResult);
      return successResult;
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      console.error('❌ Failed to start live session:', errorMessage);
      
      setError(errorMessage);
      
      const errorResult: StartSessionResult = {
        success: false,
        error: errorMessage,
      };
      
      setResult(errorResult);
      return errorResult;

    } finally {
      setIsStarting(false);
    }
  }, [startSession]);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return {
    startFromEvent,
    isStarting,
    error,
    result,
    reset,
  };
}
