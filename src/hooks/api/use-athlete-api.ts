import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

/**
 * useAthlete - Get single athlete with full details
 * 
 * @param athleteId - ID of the athlete
 * @returns Athlete data, stats, loading state
 */
export function useAthlete(athleteId: string) {
  const { data, error, mutate } = useSWR(
    athleteId ? `/api/athletes/${athleteId}` : null,
    fetcher
  );

  return {
    athlete: data?.athlete || null,
    source: data?.source || 'unknown',
    error,
    isLoading: !data && !error,
    mutate,
  };
}

/**
 * useAthleteMetrics - Get athlete's active metrics and health data
 * 
 * @param athleteId - ID of the athlete
 * @returns Metrics data, grouped by category, summary stats
 */
export function useAthleteMetrics(athleteId: string) {
  const { data, error, mutate } = useSWR(
    athleteId ? `/api/athletes/${athleteId}/metrics` : null,
    fetcher
  );

  return {
    metrics: data?.metrics || [],
    grouped: data?.grouped || {},
    summary: data?.summary || {},
    source: data?.source || 'unknown',
    error,
    isLoading: !data && !error,
    mutate,
  };
}

/**
 * useAthleteReports - Get athlete's available reports
 * 
 * @param athleteId - ID of the athlete
 * @param type - Optional filter by report type
 * @returns Reports data, grouped by type, summary stats
 */
export function useAthleteReports(athleteId: string, type?: string) {
  const params = type ? `?type=${type}` : '';
  const { data, error, mutate } = useSWR(
    athleteId ? `/api/athletes/${athleteId}/reports${params}` : null,
    fetcher
  );

  return {
    reports: data?.reports || [],
    grouped: data?.grouped || {},
    summary: data?.summary || {},
    source: data?.source || 'unknown',
    error,
    isLoading: !data && !error,
    mutate,
  };
}

/**
 * useAthleteInjuries - Get athlete's injury history
 * 
 * @param athleteId - ID of the athlete
 * @param status - Optional filter by injury status (active, recovering, recovered)
 * @returns Injuries data, grouped by status, stats
 */
export function useAthleteInjuries(athleteId: string, status?: string) {
  const params = status ? `?status=${status}` : '';
  const { data, error, mutate } = useSWR(
    athleteId ? `/api/athletes/${athleteId}/injuries${params}` : null,
    fetcher
  );

  return {
    injuries: data?.injuries || [],
    grouped: data?.grouped || {},
    stats: data?.stats || {},
    source: data?.source || 'unknown',
    error,
    isLoading: !data && !error,
    mutate,
  };
}
