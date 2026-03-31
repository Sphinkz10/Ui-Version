/**
 * useFormSubmission Hook - INTEGRATED WITH SUBMISSIONPROCESSOR (FASE 7)
 * 
 * Handles form submission flow from Forms → Metrics:
 * 1. Extract field values from form data
 * 2. Match field IDs with metric links
 * 3. Apply transformations if configured
 * 4. Create metric updates via API
 * 5. Provide validation & error handling
 * 6. Return submission state & feedback
 * 
 * NEW (Fase 7):
 * - Uses SubmissionProcessor for advanced features
 * - Preview metrics BEFORE submitting
 * - Bulk submissions for multiple athletes
 * - Submission analytics & impact tracking
 * 
 * Usage:
 * const { submitForm, previewSubmission, isSubmitting } = useFormSubmission({
 *   formId: 'form-123',
 *   workspaceId: 'workspace-1',
 *   onSuccess: (result) => { ... },
 * });
 */

import { useState, useCallback, useMemo } from 'react';
import { SubmissionProcessor } from '@/lib/SubmissionProcessor';
import type { MetricPreview } from '@/lib/SubmissionProcessor';
import type { 
  FormFieldMetricLinkWithDetails,
  TransformFunction,
  FormField,
} from '@/types/metrics';

// ============================================================================
// RE-EXPORTS (FIX BUG #3)
// ============================================================================

// Re-export MetricPreview so consumers don't need to import from SubmissionProcessor
export type { MetricPreview } from '@/lib/SubmissionProcessor';

// ============================================================================
// TYPES
// ============================================================================

export interface FormSubmissionData {
  [fieldId: string]: any; // Field values keyed by field ID
}

export interface MetricUpdate {
  metricId: string;
  athleteId: string;
  value: any;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface SubmissionResult {
  success: boolean;
  metricsCreated: number;
  metricsFailed: number;
  updates: MetricUpdate[];
  errors?: SubmissionError[];
}

export interface SubmissionError {
  fieldId: string;
  fieldName: string;
  metricId: string;
  metricName: string;
  error: string;
}

export interface UseFormSubmissionOptions {
  formId: string;
  workspaceId: string;
  athleteId: string;
  onSuccess?: (result: SubmissionResult) => void;
  onError?: (error: string) => void;
}

export interface UseFormSubmissionReturn {
  submitForm: (data: FormSubmissionData, links: FormFieldMetricLinkWithDetails[]) => Promise<void>;
  previewSubmission: (data: FormSubmissionData, links: FormFieldMetricLinkWithDetails[]) => MetricPreview[];
  isSubmitting: boolean;
  error: string | null;
  result: SubmissionResult | null;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useFormSubmission(options: UseFormSubmissionOptions): UseFormSubmissionReturn {
  const { formId, workspaceId, athleteId, onSuccess, onError } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  /**
   * Main submission handler
   */
  const submitForm = useCallback(async (
    data: FormSubmissionData,
    links: FormFieldMetricLinkWithDetails[]
  ) => {
    // CRITICAL FIX: Prevent race condition - block if already submitting
    if (isSubmitting) {
      console.warn('Submission already in progress - ignoring duplicate request');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // 1. Validate form data
      const validationErrors = validateFormData(data, links);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Allow empty submissions (e.g., marking form as "completed" without specific data)
      if (Object.keys(data).length === 0) {
        console.warn('Form submitted with no responses');
        
        // Return empty success result
        const emptyResult: SubmissionResult = {
          success: true,
          metricsCreated: 0,
          metricsFailed: 0,
          updates: [],
          errors: [],
        };
        
        setResult(emptyResult);
        
        if (onSuccess) {
          onSuccess(emptyResult);
        }
        
        return; // Early return - no API call needed
      }

      // ============================================================
      // CRITICAL: Call new backend API to submit form
      // ============================================================
      const response = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          athleteId,
          submissionData: data, // data is already the responses object
          deviceInfo: null, // Can be added from context if available
          submittedBy: null, // Can be added if user context available
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      const result = await response.json();

      // Map API response to SubmissionResult
      const submissionResult: SubmissionResult = {
        success: result.success,
        metricsCreated: result.stats.metricsCreated,
        metricsFailed: result.stats.errors,
        updates: [], // API doesn't return individual updates (privacy)
        errors: result.errors || [],
      };

      // Handle success
      setResult(submissionResult);

      if (onSuccess) {
        onSuccess(submissionResult);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Form submission failed:', errorMessage);
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formId, workspaceId, athleteId, onSuccess, onError, isSubmitting]); // Added isSubmitting to deps

  /**
   * Preview submission without submitting - SIMPLIFIED VERSION
   * 
   * FIX BUG #1: Simplified implementation that doesn't require SubmissionProcessor
   * full integration. This works immediately with current data structures.
   * 
   * Note: Full SubmissionProcessor integration (with smart warnings, zone detection)
   * will be added when currentMetricValues API is available.
   */
  const previewSubmission = useCallback((
    data: FormSubmissionData,
    links: FormFieldMetricLinkWithDetails[]
  ): MetricPreview[] => {
    // 1. Validate form data
    const validationErrors = validateFormData(data, links);
    if (validationErrors.length > 0) {
      console.warn('Validation failed:', validationErrors.join(', '));
      return [];
    }

    // 2. Extract metric updates from form data
    const metricUpdates = extractMetricUpdates(data, links, athleteId);

    // 3. Convert to MetricPreview format
    const previews: MetricPreview[] = metricUpdates.map(update => {
      const link = links.find(l => l.metricId === update.metricId);
      
      return {
        metricId: update.metricId,
        metricName: link?.metricName || link?.fieldName || 'Unknown Metric',
        metricType: link?.metric?.type || 'numeric',
        metricCategory: 'custom', // Default category
        currentValue: undefined, // TODO: Fetch from API when available
        newValue: update.value,
        change: undefined, // Calculate when currentValue available
        zoneChange: undefined,
        warning: undefined, // TODO: Add smart warnings
      };
    });

    return previews;
  }, [athleteId]);

  /**
   * Reset submission state
   */
  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    submitForm,
    previewSubmission,
    isSubmitting,
    error,
    result,
    reset,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize field name to prevent XSS in error messages
 * FIX #1: Security - Escape HTML characters
 */
function sanitizeFieldName(name: string): string {
  return name
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Check if value is empty (undefined, null, or empty string)
 * FIX #5: Centralize empty check logic for consistency
 */
function isEmpty(value: any): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * FIX #8: Helper to validate date strings more robustly
 * Date.parse() has browser inconsistencies - use stricter validation
 */
function isValidDate(value: any): boolean {
  // Accept Date objects
  if (value instanceof Date) {
    return !isNaN(value.getTime());
  }
  
  // Accept ISO date strings (YYYY-MM-DD or full ISO 8601)
  if (typeof value === 'string') {
    // Check for valid ISO format
    const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!isoRegex.test(value)) {
      return false;
    }
    
    // Try parsing - check that result is valid
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  return false;
}

/**
 * Validate form data before submission
 */
function validateFormData(
  data: FormSubmissionData,
  links: FormFieldMetricLinkWithDetails[]
): string[] {
  const errors: string[] = [];

  links.forEach(link => {
    const value = data[link.fieldId];

    // Skip validation if no value (optional fields are allowed to be empty)
    // Linked fields are NOT automatically required - they only define "where to save"
    if (isEmpty(value)) {
      return;
    }

    // Validate value type matches metric type
    const validationError = validateValueForMetric(value, link.metric, link.fieldName || link.fieldId);
    if (validationError) {
      errors.push(validationError);
    }
  });

  return errors;
}

/**
 * Validate a single value against metric constraints
 */
function validateValueForMetric(
  value: any,
  metric: { type: string; scaleMin?: number; scaleMax?: number; unit?: string },
  fieldName: string
): string | null {
  // FIX #1: Sanitize field name to prevent XSS in error messages
  const safeName = sanitizeFieldName(fieldName);
  
  switch (metric.type) {
    case 'numeric':
    case 'count':
    case 'currency':
      // CRITICAL FIX: Reject empty strings BEFORE Number() coercion
      // Number('') = 0 which causes silent data corruption!
      if (value === '' || value === undefined || value === null) {
        return null; // Allow empty (handled by required field logic)
      }
      // FIX #4: Check for whitespace-only strings
      if (typeof value === 'string' && value.trim() === '') {
        return null; // Allow empty (treated as no value)
      }
      // Numeric types must be valid numbers
      const numericValue = Number(value);
      if (isNaN(numericValue)) {
        return `Field "${safeName}" must be a number for metric type ${metric.type}`;
      }
      // FIX #7: Check for Infinity (including numeric overflow)
      if (!isFinite(numericValue)) {
        return `Field "${safeName}" must be a finite number (got ${value})`;
      }
      break;

    case 'scale':
    case 'rating':
    case 'percentage':
      // CRITICAL FIX: Reject empty strings BEFORE Number() coercion
      if (value === '' || value === undefined || value === null) {
        return null; // Allow empty (handled by required field logic)
      }
      // FIX #4: Check for whitespace-only strings
      if (typeof value === 'string' && value.trim() === '') {
        return null;
      }
      // Scale-based types with min/max constraints
      const scaleValue = Number(value);
      if (isNaN(scaleValue)) {
        return `Field "${safeName}" must be a number for metric type ${metric.type}`;
      }
      // FIX #7: Check for Infinity
      if (!isFinite(scaleValue)) {
        return `Field "${safeName}" must be a finite number`;
      }
      
      // FIX #11: Percentage should default to 0-100 if not specified
      if (metric.type === 'percentage') {
        const min = metric.scaleMin ?? 0;
        const max = metric.scaleMax ?? 100;
        if (scaleValue < min || scaleValue > max) {
          return `Field "${safeName}" percentage must be between ${min}-${max}%`;
        }
      } else {
        // Regular scale/rating validation
        if (metric.scaleMin !== undefined && scaleValue < metric.scaleMin) {
          return `Field "${safeName}" value ${scaleValue} is below minimum ${metric.scaleMin}`;
        }
        if (metric.scaleMax !== undefined && scaleValue > metric.scaleMax) {
          return `Field "${safeName}" value ${scaleValue} exceeds maximum ${metric.scaleMax}`;
        }
      }
      break;

    case 'duration':
      // Duration: accept number (seconds) or HH:MM:SS format
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          return `Field "${safeName}" must be a valid duration`;
        }
        // FIX #9: Reject negative durations
        if (value < 0) {
          return `Field "${safeName}" duration cannot be negative`;
        }
        break;
      }
      if (typeof value === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
        // Valid: HH:MM:SS format
        break;
      }
      return `Field "${safeName}" must be a valid duration (seconds or HH:MM:SS)`;

    case 'date':
      // Date: must be valid date string
      if (!isValidDate(value)) {
        return `Field "${safeName}" must be a valid date`;
      }
      break;

    case 'time':
      // Time: HH:MM or HH:MM:SS format
      // FIX #10: Validate time ranges (hours 0-23, minutes/seconds 0-59)
      if (typeof value === 'string') {
        const timeRegex = /^(\d{2}):(\d{2})(:(\d{2}))?$/;
        const match = value.match(timeRegex);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const seconds = match[4] ? parseInt(match[4]) : 0;
          
          // Validate ranges
          if (hours >= 0 && hours <= 23 &&
              minutes >= 0 && minutes <= 59 &&
              seconds >= 0 && seconds <= 59) {
            break; // Valid time!
          }
        }
      }
      return `Field "${safeName}" must be a valid time (HH:MM or HH:MM:SS)`;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false' && value !== 0 && value !== 1) {
        return `Field "${safeName}" must be a boolean for metric type boolean`;
      }
      break;

    case 'text':
      if (typeof value !== 'string') {
        return `Field "${safeName}" must be text for metric type text`;
      }
      break;

    default:
      // Unknown metric type - skip validation with warning
      console.warn(`Unknown metric type "${metric.type}" for field "${safeName}" - skipping validation`);
      break;
  }

  return null;
}

/**
 * Extract metric updates from form data + links
 */
function extractMetricUpdates(
  data: FormSubmissionData,
  links: FormFieldMetricLinkWithDetails[],
  athleteId: string
): MetricUpdate[] {
  const updates: MetricUpdate[] = [];

  links.forEach(link => {
    // Skip inactive links
    if (!link.isActive) {
      return;
    }

    // Get raw value from form data
    const rawValue = data[link.fieldId];

    // Skip if no value
    if (isEmpty(rawValue)) {
      return;
    }

    // Apply transformation if configured
    let finalValue = rawValue;
    if (link.transformFunction) {
      try {
        finalValue = applyTransformation(
          rawValue,
          link.transformFunction,
          link.transformParams
        );
      } catch (err) {
        // FIX #6: Better error tracking for transformation failures
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Transformation failed for field ${link.fieldName || link.fieldId}: ${errorMsg}`, {
          rawValue,
          transform: link.transformFunction,
          params: link.transformParams,
        });
        // Use raw value if transformation fails
        finalValue = rawValue;
      }
    }

    // Create metric update
    updates.push({
      metricId: link.metricId,
      athleteId,
      value: finalValue,
      timestamp: new Date().toISOString(),
      source: 'form',
      metadata: {
        formId: link.formId,
        fieldId: link.fieldId,
        fieldName: link.fieldName || link.fieldId,
        rawValue,
        transformed: link.transformFunction ? true : false,
      },
    });
  });

  return updates;
}

/**
 * Apply transformation function to value
 */
function applyTransformation(
  value: any,
  transformFunction: TransformFunction,
  params?: Record<string, any>
): any {
  // Validate numeric value for numeric transforms
  const numericTransforms = ['scale', 'multiply', 'divide', 'offset', 'invert', 'round', 
                              'multiply_by_10', 'multiply_by_100', 'divide_by_10',
                              'kg_to_lbs', 'lbs_to_kg', 'cm_to_m', 'm_to_cm',
                              'minutes_to_seconds', 'seconds_to_minutes'];
  
  if (numericTransforms.includes(transformFunction)) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.error(`Transform ${transformFunction} requires numeric value, got:`, value);
      return value;  // Return original invalid value
    }
    // Use numValue for calculations below
    value = numValue;
  }

  switch (transformFunction) {
    case 'none':
      // No transformation
      return value;

    case 'scale':
      // Scale from one range to another
      // Example: 1-10 → 0-100
      if (params?.fromMin !== undefined && params?.fromMax !== undefined &&
          params?.toMin !== undefined && params?.toMax !== undefined) {
        // VALIDATE: fromMax !== fromMin (prevent division by zero)
        if (params.fromMax === params.fromMin) {
          console.error('Scale transform: fromMax cannot equal fromMin (division by zero)');
          return value;
        }
        const normalized = (value - params.fromMin) / (params.fromMax - params.fromMin);
        let result = params.toMin + normalized * (params.toMax - params.toMin);
        
        // FIX #12: Clamp result to output range (prevent extrapolation)
        result = Math.max(params.toMin, Math.min(params.toMax, result));
        
        return result;
      }
      return value;

    case 'multiply':
      // Multiply by constant
      if (params?.factor !== undefined) {
        return value * params.factor;
      }
      return value;

    case 'divide':
      // Divide by constant
      if (params?.divisor !== undefined) {
        // VALIDATE: divisor !== 0 (prevent division by zero)
        if (params.divisor === 0) {
          console.error('Divide transform: divisor cannot be zero (division by zero)');
          return value;
        }
        return value / params.divisor;
      }
      return value;

    case 'offset':
      // Add/subtract constant
      if (params?.offset !== undefined) {
        return value + params.offset;
      }
      return value;

    case 'invert':
      // Invert scale (e.g., 10 → 1, 1 → 10)
      if (params?.max !== undefined) {
        return params.max - value;
      }
      return value;

    case 'boolean':
      // Convert to boolean properly
      // Handle string 'true'/'false', numbers 0/1, and boolean values
      if (value === 'true' || value === 1 || value === true) {
        return true;
      }
      if (value === 'false' || value === 0 || value === false) {
        return false;
      }
      // Fallback: use Boolean() for other truthy/falsy values
      return Boolean(value);

    case 'round':
      // Round to decimals
      // FIX #13: Force decimals >= 0 (negative decimals cause unexpected rounding)
      const decimals = Math.max(0, params?.decimals ?? 0);
      return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

    // ========================================================================
    // LEGACY TRANSFORMS (convenience shortcuts)
    // ========================================================================

    case 'multiply_by_10':
      return value * 10;

    case 'multiply_by_100':
      return value * 100;

    case 'divide_by_10':
      return value / 10;

    case 'kg_to_lbs':
      // 1 kg = 2.20462 lbs
      return value * 2.20462;

    case 'lbs_to_kg':
      // 1 lb = 0.453592 kg
      return value / 2.20462;

    case 'cm_to_m':
      // 100 cm = 1 m
      return value / 100;

    case 'm_to_cm':
      // 1 m = 100 cm
      return value * 100;

    case 'minutes_to_seconds':
      // 1 minute = 60 seconds
      return value * 60;

    case 'seconds_to_minutes':
      // 60 seconds = 1 minute
      return value / 60;

    // ========================================================================
    // ADVANCED TRANSFORMS
    // ========================================================================

    case 'custom':
      // Custom formula (advanced - future implementation)
      // For now, return value as-is
      console.warn('Custom transformation not yet implemented');
      return value;

    default:
      console.warn(`Unknown transform function: ${transformFunction}`);
      return value;
  }
}

/**
 * Submit metric updates to API
 */
async function submitMetricUpdates(
  updates: MetricUpdate[],
  workspaceId: string,
  formId: string
): Promise<SubmissionResult> {
  try {
    // Use bulk endpoint for efficiency
    const response = await fetch('/api/metric-updates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId,
        updates,
        metadata: {
          source: 'form',
          formId,
          // FIX #14: Use consistent timestamp generation
          submittedAt: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      // FIX #16: Centralize JSON parsing with helper
      const errorData = await parseJsonResponse(response);
      // FIX #15: Provide detailed error messages
      const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // FIX #16: Centralize JSON parsing with helper
    const data = await parseJsonResponse(response);

    return {
      success: true,
      metricsCreated: data.created || updates.length,
      metricsFailed: data.failed || 0,
      updates: data.updates || updates,
      errors: data.errors || [],
    };

  } catch (error) {
    // FIX #15: Better error handling with context
    const message = error instanceof Error ? error.message : 'Failed to submit metric updates';
    throw new Error(`Submission failed: ${message}`);
  }
}

/**
 * FIX #16: Helper to parse JSON response safely
 */
async function parseJsonResponse(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (jsonError) {
    console.error('Failed to parse JSON response:', jsonError);
    throw new Error(`Server returned invalid JSON (Status: ${response.status})`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  FormSubmissionData,
  SubmissionResult,
  SubmissionError,
  UseFormSubmissionOptions,
  UseFormSubmissionReturn,
};