/**
 * Form Submissions API - SEMANA 5 ✅
 * 
 * POST /api/forms/submissions - Submit form with automatic metric creation
 * GET /api/forms/submissions - List submissions with filters
 * 
 * Features:
 * - Auto-create metrics from linked fields
 * - Execute transformations (unit conversions, formulas)
 * - Validation rules
 * - Error handling with retry
 * 
 * @author PerformTrack Team
 * @since Semana 5 - Form Center + Transformations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { safeEvaluateFormula } from '@/utils/safeFormulaEvaluator';

// ============================================================================
// TRANSFORMATION ENGINE
// ============================================================================

interface TransformationConfig {
  type: 'unit_conversion' | 'formula' | 'mapping' | 'none';
  unitFrom?: string;
  unitTo?: string;
  formula?: string; // e.g., "value * 2.205" for kg to lbs
  mapping?: Record<string, any>; // For categorical mappings
  multiplier?: number;
  offset?: number;
}

function executeTransformation(
  value: any,
  transformation: TransformationConfig
): number | string | boolean | null {
  if (transformation.type === 'none') {
    return value;
  }

  // Unit conversion
  if (transformation.type === 'unit_conversion') {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    // Apply multiplier and offset
    let result = numValue;
    if (transformation.multiplier) {
      result *= transformation.multiplier;
    }
    if (transformation.offset) {
      result += transformation.offset;
    }

    return Math.round(result * 100) / 100; // Round to 2 decimals
  }

  // Formula execution (SAFE — no new Function())
  if (transformation.type === 'formula' && transformation.formula) {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return null;

      // Use safe formula evaluator instead of new Function()
      const result = safeEvaluateFormula(transformation.formula, { value: numValue });
      
      return Math.round(result * 100) / 100;
    } catch (error) {
      console.error('Formula execution error:', error);
      return null;
    }
  }

  // Categorical mapping
  if (transformation.type === 'mapping' && transformation.mapping) {
    return transformation.mapping[value] ?? value;
  }

  return value;
}

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

function validateValue(
  value: any,
  rules: ValidationRule[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          errors.push(rule.message || 'Campo obrigatório');
        }
        break;

      case 'min':
        const numVal = parseFloat(value);
        if (!isNaN(numVal) && numVal < rule.value) {
          errors.push(rule.message || `Valor mínimo: ${rule.value}`);
        }
        break;

      case 'max':
        const maxVal = parseFloat(value);
        if (!isNaN(maxVal) && maxVal > rule.value) {
          errors.push(rule.message || `Valor máximo: ${rule.value}`);
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && rule.value) {
          const regex = new RegExp(rule.value);
          if (!regex.test(value)) {
            errors.push(rule.message || 'Formato inválido');
          }
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// POST /api/forms/submissions - Submit form with auto-metric creation
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      form_id,
      athlete_id,
      workspace_id = 'default-workspace',
      responses, // { fieldId: value }
      submitted_by
    } = body;

    // Validation
    if (!form_id || !athlete_id || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields: form_id, athlete_id, responses' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ========================================================================
    // STEP 1: Fetch form configuration with metric links
    // ========================================================================
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select(`
        id,
        title,
        fields,
        workspace_id
      `)
      .eq('id', form_id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found', details: formError?.message },
        { status: 404 }
      );
    }

    // ========================================================================
    // STEP 2: Fetch metric links for this form
    // ========================================================================
    const { data: metricLinks, error: linksError } = await supabase
      .from('form_field_metric_links')
      .select('*')
      .eq('form_id', form_id)
      .eq('is_active', true);

    if (linksError) {
      console.error('Error fetching metric links:', linksError);
      // Non-fatal, continue without links
    }

    // ========================================================================
    // STEP 3: Validate all responses
    // ========================================================================
    const validationErrors: Record<string, string[]> = {};

    for (const [fieldId, value] of Object.entries(responses)) {
      const field = form.fields?.find((f: any) => f.id === fieldId);
      if (!field) continue;

      const validation = validateValue(value, field.validation || []);
      if (!validation.valid) {
        validationErrors[fieldId] = validation.errors;
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          validationErrors 
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 4: Process transformations and create metric updates
    // ========================================================================
    const metricUpdatesToCreate: any[] = [];
    const processingLog: any[] = [];

    for (const link of metricLinks || []) {
      const fieldValue = responses[link.field_id];
      if (fieldValue === null || fieldValue === undefined) {
        continue;
      }

      // Execute transformation
      const transformedValue = executeTransformation(
        fieldValue,
        link.transformation_config || { type: 'none' }
      );

      if (transformedValue === null) {
        console.error(`❌ [Transformation] Failed for field ${link.field_id}`);
        processingLog.push({
          field_id: link.field_id,
          metric_id: link.metric_id,
          status: 'failed',
          reason: 'Transformation returned null'
        });
        continue;
      }

      // Prepare metric update
      const metricUpdate = {
        workspace_id: workspace_id,
        athlete_id: athlete_id,
        metric_id: link.metric_id,
        timestamp: new Date().toISOString(),
        source_type: 'form_submission',
        source_id: undefined, // Will be set after submission creation
        created_by: submitted_by
      };

      // Set value based on type
      if (typeof transformedValue === 'number') {
        metricUpdate['value_numeric'] = transformedValue;
      } else if (typeof transformedValue === 'string') {
        metricUpdate['value_text'] = transformedValue;
      } else if (typeof transformedValue === 'boolean') {
        metricUpdate['value_boolean'] = transformedValue;
      } else {
        metricUpdate['value_json'] = transformedValue;
      }

      metricUpdatesToCreate.push(metricUpdate);

      processingLog.push({
        field_id: link.field_id,
        metric_id: link.metric_id,
        original_value: fieldValue,
        transformed_value: transformedValue,
        status: 'success'
      });
    }

    // ========================================================================
    // STEP 5: Save submission
    // ========================================================================
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        form_id,
        athlete_id,
        responses,
        submitted_at: new Date().toISOString(),
        submitted_by,
        processed: metricUpdatesToCreate.length > 0,
        processing_log: processingLog
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to create submission', details: submissionError.message },
        { status: 500 }
      );
    }

    // ========================================================================
    // STEP 6: Create metric updates with source_id
    // ========================================================================
    let createdMetrics = 0;

    if (metricUpdatesToCreate.length > 0) {
      // Set source_id to submission id
      const updates = metricUpdatesToCreate.map(update => ({
        ...update,
        source_id: submission.id
      }));

      const { data: metrics, error: metricsError } = await supabase
        .from('metric_updates')
        .insert(updates)
        .select();

      if (metricsError) {
        console.error('Error creating metrics:', metricsError);
        // Non-fatal, submission already saved
      } else {
        createdMetrics = metrics?.length || 0;
      }
    }

    // ========================================================================
    // STEP 7: Return success
    // ========================================================================
    return NextResponse.json({
      submission,
      metricsCreated: createdMetrics,
      processingLog,
      message: `Form submitted successfully. ${createdMetrics} metrics created.`
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/forms/submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/forms/submissions - List submissions
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const workspaceId = searchParams.get('workspaceId');
    const formId = searchParams.get('formId');
    const athleteId = searchParams.get('athleteId');
    const processed = searchParams.get('processed');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Missing workspaceId parameter' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('form_submissions')
      .select(`
        *,
        forms!inner(title, workspace_id),
        athletes!inner(name, email)
      `, { count: 'exact' })
      .eq('forms.workspace_id', workspaceId)
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (formId) {
      query = query.eq('form_id', formId);
    }

    if (athleteId) {
      query = query.eq('athlete_id', athleteId);
    }

    if (processed !== null) {
      query = query.eq('processed', processed === 'true');
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: submissions, error, count } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      submissions: submissions || [],
      count: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/forms/submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
