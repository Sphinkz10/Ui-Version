import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

export function useReportTemplates(workspaceId: string, category?: string) {
  const params = new URLSearchParams({
    workspaceId,
    ...(category ? { category } : {}),
  });

  const { data, error, mutate } = useSWR(
    `/api/reports/templates?${params}`,
    fetcher
  );

  return {
    templates: data?.templates || [],
    stats: data?.stats || {},
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useExecuteReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute report');
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
