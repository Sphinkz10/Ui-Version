import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

export function useExercises(
  workspaceId: string,
  filters?: {
    category?: string;
    complexity?: string;
    search?: string;
    includeGlobal?: boolean;
  }
) {
  const params = new URLSearchParams({
    workspaceId,
    ...(filters || {}) as any,
  });

  const { data, error, mutate } = useSWR(
    `/api/exercises?${params}`,
    fetcher
  );

  return {
    exercises: data?.exercises || [],
    count: data?.count || 0,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useCreateExercise() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create exercise');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
}

export function useWorkouts(
  workspaceId: string,
  filters?: {
    type?: string;
    difficulty?: string;
    includeExercises?: boolean;
  }
) {
  const params = new URLSearchParams({
    workspaceId,
    ...(filters || {}) as any,
  });

  const { data, error, mutate } = useSWR(
    `/api/workouts?${params}`,
    fetcher
  );

  return {
    workouts: data?.workouts || [],
    count: data?.count || 0,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useCreateWorkout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workout');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
}

export function useUpdateWorkout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/workouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workout');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
}
