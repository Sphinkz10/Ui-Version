import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

export function useAnalyticsDashboard(
  workspaceId: string,
  options?: {
    dateRange?: string;
    athleteIds?: string[];
    forceRefresh?: boolean;
  }
) {
  const params = new URLSearchParams({
    workspaceId,
    dateRange: options?.dateRange || 'today',
    athleteIds: options?.athleteIds?.join(',') || '',
    forceRefresh: options?.forceRefresh ? 'true' : 'false',
  });

  const { data, error, mutate } = useSWR(
    `/api/analytics/dashboard?${params}`,
    fetcher,
    {
      refreshInterval: options?.forceRefresh ? 0 : 60000, // 1 min
    }
  );

  return {
    attendance: data?.attendance || { present: 0, total: 0, percentage: 0, trend: '' },
    sessions: data?.sessions || { completedToday: 0, totalToday: 0, completionRate: 0, trend: '' },
    nextSession: data?.nextSession || { time: '--:--', title: '', minutesUntil: 0 },
    alerts: data?.alerts || { critical: 0, high: 0, medium: 0, total: 0 },
    error,
    isLoading: !data && !error,
    mutate,
  };
}
