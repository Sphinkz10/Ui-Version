import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

/**
 * useSubmissions - Fetch form submissions with filters
 */
export function useSubmissions(filters?: {
  athleteId?: string;
  formTemplateId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = 'workspace-1'; // TODO: Get from context

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Build query params
        const params = new URLSearchParams({ workspaceId });
        if (filters?.athleteId) params.append('athleteId', filters.athleteId);
        if (filters?.formTemplateId) params.append('formTemplateId', filters.formTemplateId);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        // Check if Supabase is configured
        const projectId = (window as any).__SUPABASE_PROJECT_ID__;
        const publicAnonKey = (window as any).__SUPABASE_PUBLIC_ANON_KEY__;

        if (!projectId || !publicAnonKey) {
          // Return mock data if Supabase not configured
          if (isMounted) {
            setData([]);
            setIsLoading(false);
          }
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b183f0a7/api/submissions?${params}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (isMounted) {
          setData(result.data || []);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('useSubmissions error:', err);
        if (isMounted) {
          // Set empty data instead of error to prevent UI breaks
          setData([]);
          setError(null);
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [filters?.athleteId, filters?.formTemplateId, filters?.startDate, filters?.endDate]);

  return { data, isLoading, error };
}

/**
 * useSubmission - Fetch single submission by ID
 */
export function useSubmission(id: string | null) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b183f0a7/api/submissions/${id}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (isMounted) {
          setData(result.data);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('useSubmission error:', err);
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { data, isLoading, error };
}

/**
 * useCreateSubmission - Create new form submission
 */
export function useCreateSubmission() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (submissionData: {
    workspaceId: string;
    athleteId: string;
    formTemplateId: string;
    responses: any[];
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b183f0a7/api/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(submissionData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setIsLoading(false);
      return result.data;
    } catch (err: any) {
      console.error('useCreateSubmission error:', err);
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  };

  return { execute, isLoading, error };
}

/**
 * useAthletes - Fetch all athletes in workspace
 */
export function useAthletes(workspaceId: string) {
  const { data, error, mutate } = useSWR(
    `/api/athletes?workspaceId=${workspaceId}`,
    fetcher
  );

  return {
    athletes: data?.athletes || [],
    error,
    isLoading: !data && !error,
    mutate,
  };
}

/**
 * useCreateAthlete - Create new athlete
 */
export function useCreateAthlete() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    // Import Supabase client dynamically to avoid circular dependencies if any
    const { supabase } = await import('@/lib/supabase/client');

    try {
      // Debug: Check session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[useCreateAthlete] Current Session:', session);
      console.log('[useCreateAthlete] User ID:', session?.user?.id);
      console.log('[useCreateAthlete] Role:', session?.user?.role);

      if (!session) {
        console.warn('[useCreateAthlete] No active session found! RLS may fail.');
      }

      // Validate required fields
      if (!body.workspaceId || !body.name) {
        throw new Error('WorkspaceID and Name are required');
      }

      // Prepare data for insertion (matching DB schema)
      const athleteData = {
        workspace_id: body.workspaceId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        date_of_birth: body.birthDate || null,
        sport: body.sport || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        // Optional metadata from form
        // level: body.level 
      };

      const { data, error } = await supabase
        .from('athletes')
        .insert(athleteData as any)
        .select()
        .single();

      if (error) {
        console.error('Supabase create athlete error:', error);
        throw new Error(error.message);
      }

      return { success: true, athlete: data };

    } catch (err: any) {
      console.error('Create athlete error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { execute, isLoading, error };
}

/**
 * usePlans - Fetch all training plans in workspace
 */
export function usePlans(workspaceId: string) {
  const { data, error, mutate } = useSWR(
    `/api/plans?workspaceId=${workspaceId}`,
    fetcher
  );

  return {
    plans: data?.plans || [],
    error,
    isLoading: !data && !error,
    mutate,
  };
}
