import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

export function useSessions(
  workspaceId: string,
  filters?: {
    athleteId?: string;
    coachId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const params = new URLSearchParams({ workspaceId, ...filters as any });
  const { data, error, mutate } = useSWR(
    `/api/sessions?${params}`,
    fetcher
  );

  return {
    sessions: data?.sessions || [],
    count: data?.count || 0,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useCreateSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
}

export function useCompleteSession(sessionId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (snapshotData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotData,
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete session');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return { execute, isLoading, error };
}
