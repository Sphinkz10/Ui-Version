/**
 * USE EXERCISES HOOK - SEMANA 6 ✅
 * 
 * Custom hook para gerenciar exercises (Design Studio)
 * 
 * Features:
 * - Fetch exercises with filters
 * - Create/update/delete exercises
 * - Custom fields support
 * - Search & filters
 * - Error handling
 * 
 * @since Semana 6 - Design Studio
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'timer' | 'reps' | 'weight' | 'distance' | 'custom';
  unit?: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  min?: number;
  max?: number;
  visible?: boolean;
}

export interface Exercise {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  category?: string;
  muscle_groups?: string[];
  equipment?: string[];
  custom_fields?: CustomField[];
  media_url?: string;
  video_url?: string;
  instructions?: string;
  coaching_notes?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_global?: boolean;
  is_active?: boolean;
  tags?: string[];
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

interface UseExercisesOptions {
  workspaceId?: string;
  category?: string;
  muscleGroup?: string;
  equipment?: string;
  search?: string;
  autoFetch?: boolean;
}

interface UseExercisesReturn {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  fetchExercises: () => Promise<void>;
  createExercise: (data: Partial<Exercise>) => Promise<Exercise | null>;
  updateExercise: (id: string, data: Partial<Exercise>) => Promise<boolean>;
  deleteExercise: (id: string) => Promise<boolean>;
  getExercise: (id: string) => Promise<Exercise | null>;
  refreshing: boolean;
}

export function useExercises({
  workspaceId = 'default-workspace',
  category,
  muscleGroup,
  equipment,
  search,
  autoFetch = true
}: UseExercisesOptions = {}): UseExercisesReturn {
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH EXERCISES
  // ============================================================================
  const fetchExercises = useCallback(async () => {
    try {
      const isInitialLoad = exercises.length === 0;

      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const params = new URLSearchParams({
        workspaceId,
        ...(category && { category }),
        ...(muscleGroup && { muscleGroup }),
        ...(equipment && { equipment }),
        ...(search && { search })
      });

      const response = await fetch(`/app/api/exercises?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.statusText}`);
      }

      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (err: any) {
      console.error('❌ [useExercises] Error:', err);
      setError(err.message);
      toast.error('Erro ao carregar exercícios', {
        description: err.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, category, muscleGroup, equipment, search, exercises.length]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchExercises();
    }
  }, [autoFetch, category, muscleGroup, equipment, search]);

  // ============================================================================
  // CREATE EXERCISE
  // ============================================================================
  const createExercise = useCallback(async (
    data: Partial<Exercise>
  ): Promise<Exercise | null> => {
    try {
      const payload = {
        workspace_id: workspaceId,
        ...data
      };

      const response = await fetch('/app/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create exercise: ${response.statusText}`);
      }

      const result = await response.json();
      const newExercise = result.exercise;

      // Optimistic update
      setExercises(prev => [newExercise, ...prev]);

      toast.success('Exercício criado!', {
        description: newExercise.name
      });

      return newExercise;

    } catch (err: any) {
      console.error('❌ [useExercises] Create error:', err);
      toast.error('Erro ao criar exercício', {
        description: err.message
      });
      return null;
    }
  }, [workspaceId]);

  // ============================================================================
  // UPDATE EXERCISE
  // ============================================================================
  const updateExercise = useCallback(async (
    id: string,
    data: Partial<Exercise>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Optimistic update
      setExercises(prev => prev.map(ex => 
        ex.id === id ? { ...ex, ...result.exercise } : ex
      ));

      toast.success('Exercício atualizado!');
      return true;

    } catch (err: any) {
      console.error('❌ [useExercises] Update error:', err);
      toast.error('Erro ao atualizar', {
        description: err.message
      });
      return false;
    }
  }, []);

  // ============================================================================
  // DELETE EXERCISE
  // ============================================================================
  const deleteExercise = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/exercises/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      // Optimistic delete
      setExercises(prev => prev.filter(ex => ex.id !== id));

      toast.success('Exercício removido');
      return true;

    } catch (err: any) {
      console.error('❌ [useExercises] Delete error:', err);
      toast.error('Erro ao remover', {
        description: err.message
      });
      return false;
    }
  }, []);

  // ============================================================================
  // GET SINGLE EXERCISE
  // ============================================================================
  const getExercise = useCallback(async (id: string): Promise<Exercise | null> => {
    try {
      const response = await fetch(`/app/api/exercises/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exercise: ${response.statusText}`);
      }

      const data = await response.json();
      return data.exercise;

    } catch (err: any) {
      console.error('❌ [useExercises] Get error:', err);
      toast.error('Erro ao carregar exercício');
      return null;
    }
  }, []);

  return {
    exercises,
    loading,
    error,
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    getExercise,
    refreshing
  };
}
