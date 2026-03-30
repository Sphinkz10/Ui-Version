/**
 * React Hooks for PerformTrack APIs - FASE 6 INTEGRATION
 * 
 * Complete hooks for all 33+ APIs in the system.
 * 
 * Features:
 * - TypeScript typed
 * - Loading states
 * - Error handling
 * - Cache support (SWR)
 * - Optimistic updates
 * 
 * @author PerformTrack Team
 * @since Fase 6 - Integration & Automation
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

// ============================================================================
// TYPES
// ============================================================================

interface UseApiOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: any;
  isLoading: boolean;
  mutate: () => void;
}

interface MutationResponse<T> {
  data: T | null;
  error: any;
  isLoading: boolean;
  execute: (body?: any) => Promise<T>;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = async (url: string) => {
  return await apiClient(url);
};

/**
 * Custom fetcher that proxies API calls directly to Supabase client
 * This bypasses the need for server-side API routes in Vite
 */
const supabaseApiFetcher = async (url: string) => {
  const { supabase } = await import('@/lib/supabase/client');
  const [path, queryString] = url.split('?');
  const params = new URLSearchParams(queryString);

  // Handle /api/athletes
  if (path === '/api/athletes') {
    const workspaceId = params.get('workspaceId');
    const search = params.get('search');
    const team = params.get('team');

    if (!workspaceId) throw new Error('Workspace ID required');

    let query = supabase
      .from('athletes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active') // Default filter
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`); // Should ideally use FTS or checking specific columns
    }

    // Check if 'sport' column exists widely or if logic differs
    if (team && team !== 'all') {
      query = query.eq('sport', team);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Return structure expected by UI { athletes: [], count: 0 }
    return {
      athletes: data || [],
      count: data?.length || 0
    };
  }

  throw new Error(`Endpoint not implemented in supabaseApiFetcher: ${path}`);
};

// ============================================================================
// SESSIONS HOOKS
// ============================================================================

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

// ============================================================================
// WORKOUTS & EXERCISES HOOKS
// ============================================================================

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

// ============================================================================
// CALENDAR HOOKS
// ============================================================================

export function useCalendarEvents(
  workspaceId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
    athleteId?: string;
    coachId?: string;
    location?: string;
    tags?: string[];
    search?: string;
    includeDetails?: boolean;
  }
) {
  const params = new URLSearchParams();

  if (workspaceId) {
    params.set('workspaceId', workspaceId);
  }

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','));
          }
        } else {
          params.set(key, String(value));
        }
      }
    });
  }

  const swrKey = workspaceId ? `/api/calendar-events?${params.toString()}` : null;

  const { data, error, mutate } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000,
  });

  return {
    data,
    events: data?.events || [],
    count: data?.count || 0,
    error,
    isLoading: !data && !error,
    mutate,
    refetch: mutate,
  };
}

export function useEventParticipants(eventId: string, workspaceId: string) {
  const { data, error, mutate } = useSWR(
    eventId && workspaceId ? `/api/calendar-events/${eventId}/participants?workspace_id=${workspaceId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
    }
  );

  return {
    participants: data?.participants || [],
    count: data?.count || 0,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useAvailableAthletes(
  workspaceId: string,
  filters?: {
    search?: string;
    team?: string;
    excludeEventId?: string;
  }
) {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [trigger, setTrigger] = useState(0); // To force re-fetch

  // ✅ NEW: listen for "athlete-created" and re-fetch
  useEffect(() => {
    const handler = () => setTrigger((t) => t + 1);

    if (typeof window !== "undefined") {
      window.addEventListener("athlete-created", handler);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("athlete-created", handler);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchAthletes() {
      if (!workspaceId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { supabase } = await import('@/lib/supabase/client');

        // Debug session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) console.warn('[useAvailableAthletes] No session found');

        console.log("[useAvailableAthletes] workspaceId =", workspaceId);

        let query = supabase
          .from('athletes')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('status', 'active'); // Assuming we want active by default, or remove if not

        if (filters?.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        // Team filter (assuming 'sport' or 'team' column)
        if (filters?.team && filters.team !== 'all') {
          query = query.eq('sport', filters.team);
        }

        const { data, error } = await query;

        if (error) throw error;

        setAthletes(data || []);
        console.log('[useAvailableAthletes] Fetched:', data?.length);

      } catch (err: any) {
        console.error('[useAvailableAthletes] Error:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAthletes();
  }, [workspaceId, filters?.search, filters?.team, trigger]);

  const mutate = () => setTrigger(t => t + 1);

  return {
    athletes,
    count: athletes.length,
    error,
    isLoading,
    mutate,
  };
}

export function useCreateCalendarEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
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

export function useUpdateCalendarEvent(eventId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  return { execute, isLoading, error };
}

export function useDeleteCalendarEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (eventId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
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

export function useBulkCreateCalendarEvents() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar-events/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create events');
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

export function useConfirmEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (eventId: string, body: {
    athleteId: string;
    status: 'confirmed' | 'declined' | 'maybe';
    reason?: string;
    reasonCategory?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-events/${eventId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm event');
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

export function useCalendarBlocks(
  workspaceId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    blockType?: string;
  }
) {
  const params = new URLSearchParams({
    workspaceId,
    ...(filters as any)
  });

  const { data, error, mutate } = useSWR(
    `/api/calendar-blocks?${params}`,
    fetcher
  );

  return {
    blocks: data?.blocks || [],
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useCalendarTemplates(
  workspaceId: string,
  filters?: {
    category?: string;
    favoritesOnly?: boolean;
  }
) {
  const params = new URLSearchParams({
    workspaceId,
    ...(filters as any)
  });

  const { data, error, mutate } = useSWR(
    `/api/calendar-templates?${params}`,
    fetcher
  );

  return {
    templates: data?.templates || [],
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useTemplateToEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (templateId: string, body: {
    startDate: string;
    athleteIds?: string[];
    overrides?: any;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-templates/${templateId}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event from template');
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

// ============================================================================
// CONFIRMATIONS HOOKS - SPRINT 3
// ============================================================================

/**
 * Get confirmations for an event
 */
export function useEventConfirmations(eventId: string) {
  const { data, error, mutate } = useSWR(
    eventId ? `/api/calendar-events/${eventId}/confirmations` : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30s
  );

  return {
    confirmations: data?.confirmations || [],
    stats: data?.stats || null,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

/**
 * Get pending confirmations dashboard
 */
export function usePendingConfirmations(
  workspaceId: string,
  filters?: {
    upcoming_only?: boolean;
    hours_before?: number;
  }
) {
  const params = new URLSearchParams({
    workspace_id: workspaceId,
    ...(filters as any)
  });

  const { data, error, mutate } = useSWR(
    workspaceId ? `/api/calendar-confirmations/pending?${params}` : null,
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

  return {
    confirmations: data?.confirmations || [],
    stats: data?.stats || null,
    error,
    isLoading: !data && !error,
    mutate,
  };
}

/**
 * Send confirmation notification
 */
export function useSendConfirmation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (confirmationId: string, method: 'email' | 'app' | 'whatsapp' = 'email') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-confirmations/${confirmationId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send confirmation');
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

/**
 * Update confirmation status
 */
export function useUpdateConfirmationStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (confirmationId: string, status: 'confirmed' | 'declined' | 'maybe' | 'attended' | 'no_show') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-confirmations/${confirmationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
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

/**
 * Check-in with QR code
 */
export function useCheckIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (checkInCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/calendar-confirmations/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ check_in_code: checkInCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check in');
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

/**
 * Send reminder to pending confirmations
 */
export function useSendReminder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (confirmationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-confirmations/${confirmationId}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reminder');
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

/**
 * Bulk send confirmations for an event
 */
export function useBulkSendConfirmations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (eventId: string, method: 'email' | 'app' | 'whatsapp' = 'email') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar-events/${eventId}/confirmations/send-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send confirmations');
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

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

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

// ============================================================================
// REPORTS HOOKS
// ============================================================================

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

// ============================================================================
// NOTIFICATIONS HOOKS
// ============================================================================

export function useNotifications(userId: string) {
  const { data, error, mutate } = useSWR(
    `/api/notifications?userId=${userId}`,
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30s
    }
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    mutate();
  }, [mutate]);

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.stats?.unread || 0,
    error,
    isLoading: !data && !error,
    markAsRead,
    mutate,
  };
}

// ============================================================================
// WEBHOOKS HOOKS
// ============================================================================

export function useWebhooks(workspaceId: string) {
  const { data, error, mutate } = useSWR(
    `/api/webhooks?workspaceId=${workspaceId}`,
    fetcher
  );

  return {
    webhooks: data?.webhooks || [],
    stats: data?.stats || {},
    error,
    isLoading: !data && !error,
    mutate,
  };
}

export function useCreateWebhook() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create webhook');
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

// ============================================================================
// EXPORT HOOK
// ============================================================================

export function useExport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (body: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
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

// ============================================================================
// AUDIT LOGS HOOK
// ============================================================================

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

// ============================================================================
// ATHLETE HOOKS - FASE 2 ✅
// ============================================================================

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

// =====================================================
// CUSTOM HOOKS
// =====================================================

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