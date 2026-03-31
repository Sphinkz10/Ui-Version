/**
 * USE REPORTS HOOK - SEMANA 7 ✅
 * 
 * Custom hook para gerenciar reports
 * 
 * Features:
 * - Fetch reports with filters
 * - Create/update/delete reports
 * - Generate PDF/Excel
 * - Schedule reports
 * 
 * @since Semana 7 - Reports + Automation
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

export interface Report {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  category?: string;
  config: any;
  data_source?: any;
  output_format?: string[];
  template_id?: string;
  is_scheduled?: boolean;
  schedule_cron?: string;
  recipients?: string[];
  last_generated_at?: string;
  next_generation_at?: string;
  is_template?: boolean;
  is_active?: boolean;
  generation_count?: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

interface UseReportsOptions {
  workspaceId?: string;
  category?: string;
  isTemplate?: boolean;
  autoFetch?: boolean;
}

interface UseReportsReturn {
  reports: Report[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  fetchReports: (signal?: AbortSignal) => Promise<void>;
  createReport: (data: Partial<Report>) => Promise<Report | null>;
  updateReport: (id: string, data: Partial<Report>) => Promise<boolean>;
  deleteReport: (id: string) => Promise<boolean>;
  generateReport: (id: string, format?: 'pdf' | 'excel' | 'web') => Promise<string | null>;
  refreshing: boolean;
}

export function useReports({
  workspaceId = 'default-workspace',
  category,
  isTemplate,
  autoFetch = true
}: UseReportsOptions = {}): UseReportsReturn {
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH REPORTS
  // ============================================================================
  const fetchReports = useCallback(async (signal?: AbortSignal) => {
    try {
      const isInitialLoad = reports.length === 0;

      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const params = new URLSearchParams({
        workspaceId,
        ...(category && { category }),
        ...(isTemplate !== undefined && { isTemplate: String(isTemplate) })
      });

      const response = await fetch(`/app/api/reports?${params}`, { signal });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Ignora o erro se o request foi abortado
      }
      console.error('❌ [useReports] Error:', err);
      setError(err.message);
      toast.error('Erro ao carregar reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, category, isTemplate, reports.length]);

  useEffect(() => {
    const controller = new AbortController();

    if (autoFetch) {
      fetchReports(controller.signal);
    }

    return () => {
      controller.abort();
    };
  }, [autoFetch, category, isTemplate, fetchReports]);

  // ============================================================================
  // CREATE REPORT
  // ============================================================================
  const createReport = useCallback(async (
    data: Partial<Report>
  ): Promise<Report | null> => {
    try {
      const payload = {
        workspace_id: workspaceId,
        ...data
      };

      const response = await fetch('/app/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create report');
      }

      const result = await response.json();
      const newReport = result.report;

      setReports(prev => [newReport, ...prev]);

      toast.success('Report criado!', {
        description: newReport.name
      });

      return newReport;

    } catch (err: any) {
      console.error('❌ [useReports] Create error:', err);
      toast.error('Erro ao criar report');
      return null;
    }
  }, [workspaceId]);

  // ============================================================================
  // UPDATE REPORT
  // ============================================================================
  const updateReport = useCallback(async (
    id: string,
    data: Partial<Report>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const result = await response.json();

      setReports(prev => prev.map(r => 
        r.id === id ? { ...r, ...result.report } : r
      ));

      toast.success('Report atualizado!');
      return true;

    } catch (err: any) {
      console.error('❌ [useReports] Update error:', err);
      toast.error('Erro ao atualizar');
      return false;
    }
  }, []);

  // ============================================================================
  // DELETE REPORT
  // ============================================================================
  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/reports/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setReports(prev => prev.filter(r => r.id !== id));

      toast.success('Report removido');
      return true;

    } catch (err: any) {
      console.error('❌ [useReports] Delete error:', err);
      toast.error('Erro ao remover');
      return false;
    }
  }, []);

  // ============================================================================
  // GENERATE REPORT
  // ============================================================================
  const generateReport = useCallback(async (
    id: string,
    format: 'pdf' | 'excel' | 'web' = 'pdf'
  ): Promise<string | null> => {
    try {
      setGenerating(true);

      toast.info('Gerando report...', {
        description: `Formato: ${format.toUpperCase()}`
      });

      const response = await fetch(`/app/api/reports/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const result = await response.json();

      toast.success('Report gerado!', {
        description: `Tempo: ${result.processingTime}ms`
      });

      // Update report stats
      setReports(prev => prev.map(r => 
        r.id === id ? { 
          ...r, 
          generation_count: (r.generation_count || 0) + 1,
          last_generated_at: new Date().toISOString()
        } : r
      ));

      return result.fileUrl;

    } catch (err: any) {
      console.error('❌ [useReports] Generate error:', err);
      toast.error('Erro ao gerar report');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    reports,
    loading,
    generating,
    error,
    fetchReports,
    createReport,
    updateReport,
    deleteReport,
    generateReport,
    refreshing
  };
}
