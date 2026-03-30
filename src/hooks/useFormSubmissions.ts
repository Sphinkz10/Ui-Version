/**
 * USE FORM SUBMISSIONS HOOK - SEMANA 5 ✅
 * 
 * Custom hook para gerenciar form submissions com transformations
 * 
 * Features:
 * - Submit form with auto-metric creation
 * - Fetch submissions history
 * - Validation before submit
 * - Error handling with retry
 * 
 * @since Semana 5 - Form Center
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { safeEvaluateFormula } from '@/utils/safeFormulaEvaluator';
import { useApp } from '@/contexts/AppContext';

export interface FormSubmission {
  id: string;
  form_id: string;
  athlete_id: string;
  responses: Record<string, any>;
  submitted_at: string;
  submitted_by?: string;
  processed: boolean;
  processing_log?: any[];
  created_at: string;
}

export interface SubmitFormOptions {
  form_id: string;
  athlete_id: string;
  responses: Record<string, any>;
  workspace_id?: string;
  submitted_by?: string;
}

export interface SubmitResult {
  success: boolean;
  submission?: FormSubmission;
  metricsCreated?: number;
  validationErrors?: Record<string, string[]>;
  error?: string;
}

interface UseFormSubmissionsReturn {
  submissions: FormSubmission[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  submitForm: (options: SubmitFormOptions) => Promise<SubmitResult>;
  fetchSubmissions: (formId?: string, athleteId?: string) => Promise<void>;
  retrySubmission: (submissionId: string) => Promise<boolean>;
}

export function useFormSubmissions(
  customWorkspaceId?: string
): UseFormSubmissionsReturn {
  const { workspace } = useApp();
  const workspaceId = customWorkspaceId || workspace?.id || 'default-workspace';
  
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // SUBMIT FORM
  // ============================================================================
  const submitForm = useCallback(async (
    options: SubmitFormOptions
  ): Promise<SubmitResult> => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...options,
        workspace_id: workspaceId
      };

      console.log(`📋 [Submit] Form ${options.form_id}, Athlete ${options.athlete_id}`);

      const response = await fetch('/app/api/forms/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Validation errors
        if (response.status === 400 && data.validationErrors) {
          toast.error('Erros de validação', {
            description: 'Verifique os campos marcados'
          });
          
          return {
            success: false,
            validationErrors: data.validationErrors
          };
        }

        throw new Error(data.error || 'Failed to submit form');
      }

      // Success
      const metricsCreated = data.metricsCreated || 0;
      
      toast.success('Formulário submetido!', {
        description: metricsCreated > 0 
          ? `${metricsCreated} métricas criadas automaticamente`
          : 'Respostas guardadas com sucesso'
      });

      console.log(`✅ [Submit] Success! Metrics created: ${metricsCreated}`);

      return {
        success: true,
        submission: data.submission,
        metricsCreated
      };

    } catch (err: any) {
      console.error('❌ [Submit] Error:', err);
      setError(err.message);
      
      toast.error('Erro ao submeter formulário', {
        description: err.message
      });

      return {
        success: false,
        error: err.message
      };
    } finally {
      setSubmitting(false);
    }
  }, [workspaceId]);

  // ============================================================================
  // FETCH SUBMISSIONS
  // ============================================================================
  const fetchSubmissions = useCallback(async (
    formId?: string,
    athleteId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        workspaceId,
        ...(formId && { formId }),
        ...(athleteId && { athleteId })
      });

      const response = await fetch(`/app/api/forms/submissions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);

      console.log(`✅ [Fetch] Loaded ${data.submissions?.length || 0} submissions`);

    } catch (err: any) {
      console.error('❌ [Fetch] Error:', err);
      setError(err.message);
      toast.error('Erro ao carregar submissions');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // ============================================================================
  // RETRY SUBMISSION (Reprocess failed submissions)
  // ============================================================================
  const retrySubmission = useCallback(async (
    submissionId: string
  ): Promise<boolean> => {
    try {
      // TODO: Implement retry endpoint
      // For now, just a placeholder
      
      toast.info('Retry não implementado ainda', {
        description: 'Feature coming soon'
      });

      return false;

    } catch (err: any) {
      console.error('❌ [Retry] Error:', err);
      toast.error('Erro ao reprocessar');
      return false;
    }
  }, []);

  return {
    submissions,
    loading,
    submitting,
    error,
    submitForm,
    fetchSubmissions,
    retrySubmission
  };
}

// ============================================================================
// TRANSFORMATION HELPERS (Client-side preview)
// ============================================================================

export interface TransformationPreview {
  original: any;
  transformed: any;
  unit?: string;
  formula?: string;
}

export function previewTransformation(
  value: any,
  config: {
    type: 'unit_conversion' | 'formula' | 'mapping' | 'none';
    multiplier?: number;
    offset?: number;
    formula?: string;
    mapping?: Record<string, any>;
  }
): TransformationPreview {
  let transformed = value;

  if (config.type === 'unit_conversion') {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      transformed = num;
      if (config.multiplier) transformed *= config.multiplier;
      if (config.offset) transformed += config.offset;
      transformed = Math.round(transformed * 100) / 100;
    }
  } else if (config.type === 'formula' && config.formula) {
    try {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        transformed = safeEvaluateFormula(config.formula, { value: num });
        transformed = Math.round((transformed as number) * 100) / 100;
      }
    } catch (e) {
      transformed = 'Error';
    }
  } else if (config.type === 'mapping' && config.mapping) {
    transformed = config.mapping[value] ?? value;
  }

  return {
    original: value,
    transformed,
    formula: config.formula
  };
}
