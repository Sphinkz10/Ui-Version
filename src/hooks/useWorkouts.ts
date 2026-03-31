/**
 * USE WORKOUTS HOOK - SEMANA 6 ✅
 * 
 * Custom hook para gerenciar workouts (Design Studio)
 * 
 * Features:
 * - Fetch workouts with filters
 * - Create/update/delete workouts
 * - Blocks structure support
 * - Progression schemes
 * - Template management
 * 
 * @since Semana 6 - Design Studio
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

export interface WorkoutBlock {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'circuit' | 'emom' | 'amrap' | 'custom';
  exercises: {
    id: string;
    exercise_id: string;
    sets?: number;
    reps?: number | string;
    rest?: number;
    load?: number | string;
    notes?: string;
    order: number;
  }[];
  rest_between_exercises?: number;
  rounds?: number;
  time_cap?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  category?: string;
  blocks: WorkoutBlock[];
  estimated_duration?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  equipment_needed?: string[];
  is_template?: boolean;
  is_active?: boolean;
  tags?: string[];
  progression_scheme?: any;
  load_prescription?: any;
  coaching_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

interface UseWorkoutsOptions {
  workspaceId?: string;
  category?: string;
  isTemplate?: boolean;
  search?: string;
  autoFetch?: boolean;
}

interface UseWorkoutsReturn {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  fetchWorkouts: (signal?: AbortSignal) => Promise<void>;
  createWorkout: (data: Partial<Workout>) => Promise<Workout | null>;
  updateWorkout: (id: string, data: Partial<Workout>) => Promise<boolean>;
  deleteWorkout: (id: string) => Promise<boolean>;
  getWorkout: (id: string, includeExercises?: boolean) => Promise<Workout | null>;
  refreshing: boolean;
}

export function useWorkouts({
  workspaceId = 'default-workspace',
  category,
  isTemplate,
  search,
  autoFetch = true
}: UseWorkoutsOptions = {}): UseWorkoutsReturn {
  
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH WORKOUTS
  // ============================================================================
  const fetchWorkouts = useCallback(async (signal?: AbortSignal) => {
    try {
      const isInitialLoad = workouts.length === 0;

      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const params = new URLSearchParams({
        workspaceId,
        ...(category && { category }),
        ...(isTemplate !== undefined && { isTemplate: String(isTemplate) }),
        ...(search && { search })
      });

      const response = await fetch(`/app/api/workouts?${params}`, { signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch workouts: ${response.statusText}`);
      }

      const data = await response.json();
      setWorkouts(data.workouts || []);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Ignora o erro se o request foi abortado
      }
      console.error('❌ [useWorkouts] Error:', err);
      setError(err.message);
      toast.error('Erro ao carregar treinos', {
        description: err.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, category, isTemplate, search, workouts.length]);

  // Auto-fetch on mount
  useEffect(() => {
    const controller = new AbortController();

    if (autoFetch) {
      fetchWorkouts(controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, [autoFetch, category, isTemplate, search, fetchWorkouts]);

  // ============================================================================
  // CREATE WORKOUT
  // ============================================================================
  const createWorkout = useCallback(async (
    data: Partial<Workout>
  ): Promise<Workout | null> => {
    try {
      const payload = {
        workspace_id: workspaceId,
        ...data
      };

      const response = await fetch('/app/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workout');
      }

      const result = await response.json();
      const newWorkout = result.workout;

      // Optimistic update
      setWorkouts(prev => [newWorkout, ...prev]);

      toast.success('Treino criado!', {
        description: newWorkout.name
      });

      return newWorkout;

    } catch (err: any) {
      console.error('❌ [useWorkouts] Create error:', err);
      toast.error('Erro ao criar treino', {
        description: err.message
      });
      return null;
    }
  }, [workspaceId]);

  // ============================================================================
  // UPDATE WORKOUT
  // ============================================================================
  const updateWorkout = useCallback(async (
    id: string,
    data: Partial<Workout>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Optimistic update
      setWorkouts(prev => prev.map(w => 
        w.id === id ? { ...w, ...result.workout } : w
      ));

      toast.success('Treino atualizado!');
      return true;

    } catch (err: any) {
      console.error('❌ [useWorkouts] Update error:', err);
      toast.error('Erro ao atualizar', {
        description: err.message
      });
      return false;
    }
  }, []);

  // ============================================================================
  // DELETE WORKOUT
  // ============================================================================
  const deleteWorkout = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/workouts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      // Optimistic delete
      setWorkouts(prev => prev.filter(w => w.id !== id));

      toast.success('Treino removido');
      return true;

    } catch (err: any) {
      console.error('❌ [useWorkouts] Delete error:', err);
      toast.error('Erro ao remover', {
        description: err.message
      });
      return false;
    }
  }, []);

  // ============================================================================
  // GET SINGLE WORKOUT
  // ============================================================================
  const getWorkout = useCallback(async (
    id: string,
    includeExercises: boolean = false
  ): Promise<Workout | null> => {
    try {
      const params = includeExercises ? '?includeExercises=true' : '';
      const response = await fetch(`/app/api/workouts/${id}${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch workout: ${response.statusText}`);
      }

      const data = await response.json();
      return data.workout;

    } catch (err: any) {
      console.error('❌ [useWorkouts] Get error:', err);
      toast.error('Erro ao carregar treino');
      return null;
    }
  }, []);

  return {
    workouts,
    loading,
    error,
    fetchWorkouts,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    getWorkout,
    refreshing
  };
}
