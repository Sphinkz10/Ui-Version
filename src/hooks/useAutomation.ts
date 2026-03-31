/**
 * USE AUTOMATION HOOK - SEMANA 7 ✅
 * 
 * Custom hook para gerenciar automation rules
 * 
 * Features:
 * - Fetch rules with filters
 * - Create/update/delete rules
 * - Execute rules manually
 * - Test mode
 * - Execution history
 * 
 * @since Semana 7 - Automation
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';

export interface AutomationRule {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  category?: string;
  trigger_config: any;
  action_config: any;
  conditions?: any;
  filters?: any;
  execution_order?: number;
  delay_seconds?: number;
  retry_on_failure?: boolean;
  max_retries?: number;
  is_active?: boolean;
  last_triggered_at?: string;
  last_execution_status?: string;
  execution_count?: number;
  success_count?: number;
  failure_count?: number;
  is_test_mode?: boolean;
  test_results?: any;
  created_by?: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
}

interface UseAutomationOptions {
  workspaceId?: string;
  category?: string;
  isActive?: boolean;
  autoFetch?: boolean;
}

interface UseAutomationReturn {
  rules: AutomationRule[];
  loading: boolean;
  executing: boolean;
  error: string | null;
  fetchRules: () => Promise<void>;
  createRule: (data: Partial<AutomationRule>) => Promise<AutomationRule | null>;
  updateRule: (id: string, data: Partial<AutomationRule>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  executeRule: (id: string, testData?: any) => Promise<boolean>;
  toggleRule: (id: string, active: boolean) => Promise<boolean>;
  refreshing: boolean;
}

export function useAutomation({
  workspaceId = 'default-workspace',
  category,
  isActive,
  autoFetch = true
}: UseAutomationOptions = {}): UseAutomationReturn {
  
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH RULES
  // ============================================================================
  const fetchRules = useCallback(async () => {
    try {
      const isInitialLoad = rules.length === 0;

      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const params = new URLSearchParams({
        workspaceId,
        ...(category && { category }),
        ...(isActive !== undefined && { isActive: String(isActive) })
      });

      const response = await fetch(`/app/api/automation/rules?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch rules');
      }

      const data = await response.json();
      setRules(data.rules || []);
    } catch (err: any) {
      console.error('❌ [useAutomation] Error:', err);
      setError(err.message);
      toast.error('Erro ao carregar regras');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId, category, isActive, rules.length]);

  useEffect(() => {
    if (autoFetch) {
      fetchRules();
    }
  }, [autoFetch, category, isActive]);

  // ============================================================================
  // CREATE RULE
  // ============================================================================
  const createRule = useCallback(async (
    data: Partial<AutomationRule>
  ): Promise<AutomationRule | null> => {
    try {
      const payload = {
        workspace_id: workspaceId,
        ...data
      };

      const response = await fetch('/app/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create rule');
      }

      const result = await response.json();
      const newRule = result.rule;

      setRules(prev => [newRule, ...prev]);

      toast.success('Regra criada!', {
        description: newRule.name
      });

      return newRule;

    } catch (err: any) {
      console.error('❌ [useAutomation] Create error:', err);
      toast.error('Erro ao criar regra');
      return null;
    }
  }, [workspaceId]);

  // ============================================================================
  // UPDATE RULE
  // ============================================================================
  const updateRule = useCallback(async (
    id: string,
    data: Partial<AutomationRule>
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/automation/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const result = await response.json();

      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, ...result.rule } : r
      ));

      toast.success('Regra atualizada!');
      return true;

    } catch (err: any) {
      console.error('❌ [useAutomation] Update error:', err);
      toast.error('Erro ao atualizar');
      return false;
    }
  }, []);

  // ============================================================================
  // DELETE RULE
  // ============================================================================
  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/automation/rules/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setRules(prev => prev.filter(r => r.id !== id));

      toast.success('Regra removida');
      return true;

    } catch (err: any) {
      console.error('❌ [useAutomation] Delete error:', err);
      toast.error('Erro ao remover');
      return false;
    }
  }, []);

  // ============================================================================
  // EXECUTE RULE
  // ============================================================================
  const executeRule = useCallback(async (
    id: string,
    testData?: any
  ): Promise<boolean> => {
    try {
      setExecuting(true);

      toast.info('Executando regra...', {
        description: testData ? 'Modo teste' : 'Execução real'
      });

      const response = await fetch(`/app/api/automation/rules/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          execution_type: testData ? 'test' : 'manual',
          input_data: testData,
          is_test: !!testData
        })
      });

      if (!response.ok) {
        throw new Error('Execution failed');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Regra executada!', {
          description: result.skipped ? 'Condições não atendidas' : 'Ação executada'
        });
      } else {
        toast.error('Execução falhou', {
          description: result.error
        });
      }

      // Update rule stats
      setRules(prev => prev.map(r => 
        r.id === id ? { 
          ...r, 
          execution_count: (r.execution_count || 0) + 1,
          last_triggered_at: new Date().toISOString(),
          last_execution_status: result.success ? 'success' : 'failed'
        } : r
      ));

      return result.success;

    } catch (err: any) {
      console.error('❌ [useAutomation] Execute error:', err);
      toast.error('Erro ao executar regra');
      return false;
    } finally {
      setExecuting(false);
    }
  }, []);

  // ============================================================================
  // TOGGLE RULE
  // ============================================================================
  const toggleRule = useCallback(async (
    id: string,
    active: boolean
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/app/api/automation/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active })
      });

      if (!response.ok) {
        throw new Error('Toggle failed');
      }

      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: active } : r
      ));

      toast.success(active ? 'Regra ativada' : 'Regra desativada');
      return true;

    } catch (err: any) {
      console.error('❌ [useAutomation] Toggle error:', err);
      toast.error('Erro ao alterar estado');
      return false;
    }
  }, []);

  return {
    rules,
    loading,
    executing,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    executeRule,
    toggleRule,
    refreshing
  };
}
