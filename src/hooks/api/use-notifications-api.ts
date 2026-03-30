import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api-client';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { fetcher, supabaseApiFetcher } from './core';

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
