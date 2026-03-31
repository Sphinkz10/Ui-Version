/**
 * USE METRIC UPDATES HOOK - SEMANA 4 ✅
 * 
 * Custom hook para gerenciar metric updates (inline editing no LiveBoard)
 * 
 * Features:
 * - Fetch metric updates for athlete
 * - Bulk create/update/delete
 * - Real-time optimistic updates
 * - Error handling
 * 
 * @since Semana 4 - Data OS V2
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

export interface MetricUpdate {
  id: string;
  workspace_id: string;
  athlete_id: string;
  metric_id: string;
  value_numeric?: number;
  value_text?: string;
  value_boolean?: boolean;
  value_json?: any;
  unit?: string;
  timestamp: string;
  source_type?: 'manual' | 'live_session' | 'form_submission' | 'integration';
  source_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface BulkUpdateEntry {
  athlete_id: string;
  value: number | string | boolean | any;
  timestamp?: string;
  notes?: string;
}

interface UseMetricUpdatesOptions {
  athleteId?: string;
  metricId?: string;
  workspaceId?: string;
  autoFetch?: boolean;
}

interface UseMetricUpdatesReturn {
  updates: MetricUpdate[];
  loading: boolean;
  error: string | null;
  fetchUpdates: () => Promise<void>;
  createUpdate: (data: Partial<MetricUpdate>) => Promise<MetricUpdate | null>;
  bulkCreate: (metricId: string, entries: BulkUpdateEntry[]) => Promise<boolean>;
  updateUpdate: (id: string, data: Partial<MetricUpdate>) => Promise<boolean>;
  deleteUpdate: (id: string) => Promise<boolean>;
  refreshing: boolean;
}

export function useMetricUpdates({
  athleteId,
  metricId,
  workspaceId = 'default-workspace',
  autoFetch = true
}: UseMetricUpdatesOptions = {}): UseMetricUpdatesReturn {
  
  const [updates, setUpdates] = useState<MetricUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH UPDATES
  // ============================================================================
  const fetchUpdates = useCallback(async () => {
    if (!metricId && !athleteId) {
      console.warn('[useMetricUpdates] Either metricId or athleteId required');
      return;
    }

    try {
      const isInitialLoad = updates.length === 0;

      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const params = new URLSearchParams({
        workspaceId,
        ...(athleteId && { athleteId }),
        ...(metricId && { metricId }),
      });

      const response = await fetch(`/app/api/metric-updates?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch updates: ${response.statusText}`);
      }

      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (err: any) {
      console.error('❌ [useMetricUpdates] Error:', err);
      setError(err.message);
      toast.error('Erro ao carregar dados', {
        description: err.message
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [athleteId, metricId, workspaceId, updates.length]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchUpdates();
    }
  }, [autoFetch, athleteId, metricId]);

  // ============================================================================
  // CREATE UPDATE
  // ============================================================================
  const createUpdate = useCallback(async (data: Partial<MetricUpdate>): Promise<MetricUpdate | null> => {
    try {
      const payload = {
        workspace_id: workspaceId,
        athlete_id: data.athlete_id || athleteId,
        metric_id: data.metric_id || metricId,
        timestamp: data.timestamp || new Date().toISOString(),
        source_type: data.source_type || 'manual',
        ...data
      };

      const response = await fetch('/app/api/metric-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create update: ${response.statusText}`);
      }

      const result = await response.json();
      const newUpdate = result.update;

      // Optimistic update
      setUpdates(prev => [newUpdate, ...prev]);

      toast.success('Valor adicionado!');
      return newUpdate;

    } catch (err: any) {
      console.error('❌ [useMetricUpdates] Create error:', err);
      toast.error('Erro ao adicionar valor', {
        description: err.message
      });
      return null;
    }
  }, [athleteId, metricId, workspaceId]);

  // ============================================================================
  // BULK CREATE
  // ============================================================================
  const bulkCreate = useCallback(async (
    targetMetricId: string,
    entries: BulkUpdateEntry[]
  ): Promise<boolean> => {
    try {
      const payload = {
        metricId: targetMetricId,
        entries: entries.map(entry => ({
          ...entry,
          timestamp: entry.timestamp || new Date().toISOString()
        }))
      };

      const response = await fetch('/app/api/metric-updates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Bulk create failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast.success(`${result.count} valores adicionados!`);
      
      // Refresh data
      await fetchUpdates();
      
      return true;

    } catch (err: any) {
      console.error('❌ [useMetricUpdates] Bulk create error:', err);
      toast.error('Erro ao adicionar valores em massa', {
        description: err.message
      });
      return false;
    }
  }, [fetchUpdates]);

  // ============================================================================
  // UPDATE UPDATE
  // ============================================================================
  const updateUpdate = useCallback(async (
    id: string,
    data: Partial<MetricUpdate>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/metric-updates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Optimistic update
      setUpdates(prev => prev.map(u => 
        u.id === id ? { ...u, ...result.update } : u
      ));

      toast.success('Valor atualizado!');
      return true;

    } catch (err: any) {
      console.error('❌ [useMetricUpdates] Update error:', err);
      toast.error('Erro ao atualizar', {
        description: err.message
      });
      return false;
    }
  }, []);

  // ============================================================================
  // DELETE UPDATE
  // ============================================================================
  const deleteUpdate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/metric-updates/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      // Optimistic delete
      setUpdates(prev => prev.filter(u => u.id !== id));

      toast.success('Valor removido');
      return true;

    } catch (err: any) {
      console.error('❌ [useMetricUpdates] Delete error:', err);
      toast.error('Erro ao remover', {
        description: err.message
      });
      return false;
    }
  }, []);

  return {
    updates,
    loading,
    error,
    fetchUpdates,
    createUpdate,
    bulkCreate,
    updateUpdate,
    deleteUpdate,
    refreshing
  };
}
