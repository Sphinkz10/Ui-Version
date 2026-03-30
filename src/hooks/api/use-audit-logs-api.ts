import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

export function useAuditLogs(
  workspaceId: string,
  filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
) {
  const params = new URLSearchParams({
    workspaceId,
    ...filters as any,
  });

  const { data, error, mutate } = useSWR(
    `/api/audit-logs?${params}`,
    fetcher
  );

  return {
    logs: data?.logs || [],
    pagination: data?.pagination || {},
    stats: data?.stats || {},
    error,
    isLoading: !data && !error,
    mutate,
  };
}
