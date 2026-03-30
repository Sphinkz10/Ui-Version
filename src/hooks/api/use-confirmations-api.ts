import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

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
