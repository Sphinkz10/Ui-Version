import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

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
