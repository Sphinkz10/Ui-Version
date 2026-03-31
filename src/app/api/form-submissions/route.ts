import { NextRequest, NextResponse } from 'next/server';
import * as kv from '@/supabase/functions/server/kv_store';

/**
 * POST /api/form-submissions
 * 
 * CRITICAL INTEGRATION POINT:
 * Saves form submission and creates metric_updates via form_field_metric_links.
 * This is what bridges Form Center → Data OS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      formId,
      athleteId,
      submissionData, // Field responses keyed by fieldId
      deviceInfo,
      submittedBy,
    } = body;

    // Validate required fields
    if (!formId || !athleteId) {
      return NextResponse.json(
        { error: 'Missing required fields: formId, athleteId' },
        { status: 400 }
      );
    }

    // ==================================================
    // 1. SAVE FORM SUBMISSION
    // ==================================================
    const submissionId = `submission_${crypto.randomUUID()}`;
    const submittedAt = new Date().toISOString();

    const submission = {
      id: submissionId,
      formId,
      athleteId,
      responses: submissionData, // Field answers
      submittedAt,
      submittedBy: submittedBy || athleteId, // Default to athlete if not specified
      deviceInfo: deviceInfo || null,
      processed: false, // Will be set to true after creating metrics
    };

    await kv.set(`submission:${submissionId}`, submission);

    // Index by athlete
    const athleteSubmissions = (await kv.get(`athlete:${athleteId}:submissions`)) || [];
    athleteSubmissions.push(submissionId);
    await kv.set(`athlete:${athleteId}:submissions`, athleteSubmissions);

    // Index by form
    const formSubmissions = (await kv.get(`form:${formId}:submissions`)) || [];
    formSubmissions.push(submissionId);
    await kv.set(`form:${formId}:submissions`, formSubmissions);

    // ==================================================
    // 2. FETCH FORM_FIELD_METRIC_LINKS FOR THIS FORM
    // ==================================================
    const linksKey = `form:${formId}:metric_links`;
    const links = (await kv.get(linksKey)) || [];

    if (links.length === 0) {
      // Mark as processed (no metrics to create)
      submission.processed = true;
      await kv.set(`submission:${submissionId}`, submission);

      return NextResponse.json({
        success: true,
        submission: {
          id: submissionId,
          submittedAt,
        },
        stats: {
          metricsCreated: 0,
          errors: 0,
        },
        message: 'Submission saved successfully (no metric links configured)',
      });
    }

    // ==================================================
    // 3. CREATE METRIC_UPDATES FROM LINKS
    // ==================================================
    const metricUpdates: any[] = [];
    const errors: any[] = [];

    for (const link of links) {
      try {
        // Skip inactive links
        if (!link.isActive) {
          continue;
        }

        // Get field value from submission
        const fieldValue = submissionData[link.fieldId];

        // Skip if field not answered
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          continue;
        }

        // Apply transformation if configured
        let transformedValue = fieldValue;
        if (link.transformFunction && link.transformFunction !== 'none') {
          try {
            transformedValue = applyTransformation(
              fieldValue,
              link.transformFunction,
              link.transformParams
            );
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            console.error(`Transformation failed for field ${link.fieldId}:`, errorMsg);
            errors.push({
              fieldId: link.fieldId,
              metricId: link.metricId,
              error: `Transformation failed: ${errorMsg}`,
            });
            continue; // Skip this link if transformation fails
          }
        }

        // Create metric_update
        const metricUpdateId = `mu_${Date.now()}_${link.metricId}_${athleteId}`;

        const metricUpdate = {
          id: metricUpdateId,
          metric_id: link.metricId,
          athlete_id: athleteId,
          workspace_id: link.workspaceId || 'default-workspace',
          value: transformedValue,
          unit: link.metric?.unit || '', // Get from linked metric if available
          category: link.metric?.category || 'custom',
          source: 'form',
          source_id: submissionId,
          recorded_at: submittedAt,
          created_at: new Date().toISOString(),
          notes: `From form: ${link.formName || formId} - Field: ${link.fieldLabel || link.fieldId}`,
        };

        await kv.set(metricUpdateId, metricUpdate);

        // Index by athlete
        const athleteUpdates = (await kv.get(`athlete:${athleteId}:metric_updates`)) || [];
        athleteUpdates.push(metricUpdateId);
        await kv.set(`athlete:${athleteId}:metric_updates`, athleteUpdates);

        metricUpdates.push(metricUpdate);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error processing link ${link.id}:`, errorMsg);
        errors.push({
          fieldId: link.fieldId,
          metricId: link.metricId,
          error: errorMsg,
        });
      }
    }

    // ==================================================
    // 4. MARK SUBMISSION AS PROCESSED
    // ==================================================
    submission.processed = true;
    submission.metricsCreated = metricUpdates.length;
    await kv.set(`submission:${submissionId}`, submission);

    if (errors.length > 0) {}

    // ==================================================
    // 5. RETURN SUCCESS WITH STATS
    // ==================================================
    return NextResponse.json({
      success: true,
      submission: {
        id: submissionId,
        submittedAt,
        processed: true,
      },
      stats: {
        metricsCreated: metricUpdates.length,
        errors: errors.length,
      },
      metricUpdates: metricUpdates.map(m => ({
        id: m.id,
        metric_id: m.metric_id,
        value: m.value,
      })),
      errors,
    });
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR processing form submission:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process form submission',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/form-submissions
 * 
 * Lists form submissions with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');
    const formId = searchParams.get('formId');

    if (athleteId) {
      // Get submissions for athlete
      const submissionIds = (await kv.get(`athlete:${athleteId}:submissions`)) || [];
      
      const submissions = await Promise.all(
        submissionIds.map(async (id: string) => {
          return await kv.get(`submission:${id}`);
        })
      );

      // Filter out nulls and sort by date
      const validSubmissions = submissions
        .filter(s => s !== null)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      return NextResponse.json({
        success: true,
        submissions: validSubmissions,
        total: validSubmissions.length,
      });
    }

    if (formId) {
      // Get submissions for form
      const submissionIds = (await kv.get(`form:${formId}:submissions`)) || [];
      
      const submissions = await Promise.all(
        submissionIds.map(async (id: string) => {
          return await kv.get(`submission:${id}`);
        })
      );

      const validSubmissions = submissions
        .filter(s => s !== null)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

      return NextResponse.json({
        success: true,
        submissions: validSubmissions,
        total: validSubmissions.length,
      });
    }

    return NextResponse.json(
      { error: 'Must provide athleteId or formId parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// TRANSFORMATION HELPER (Duplicated from useFormSubmission for server-side use)
// ============================================================================

function applyTransformation(
  value: any,
  transformFunction: string,
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
      throw new Error(`Transform ${transformFunction} requires numeric value, got: ${value}`);
    }
    value = numValue;
  }

  switch (transformFunction) {
    case 'none':
      return value;

    case 'scale':
      if (params?.fromMin !== undefined && params?.fromMax !== undefined &&
          params?.toMin !== undefined && params?.toMax !== undefined) {
        if (params.fromMax === params.fromMin) {
          throw new Error('Scale transform: fromMax cannot equal fromMin');
        }
        const normalized = (value - params.fromMin) / (params.fromMax - params.fromMin);
        let result = params.toMin + normalized * (params.toMax - params.toMin);
        result = Math.max(params.toMin, Math.min(params.toMax, result));
        return result;
      }
      return value;

    case 'multiply':
      if (params?.factor !== undefined) {
        return value * params.factor;
      }
      return value;

    case 'divide':
      if (params?.divisor !== undefined) {
        if (params.divisor === 0) {
          throw new Error('Divide transform: divisor cannot be zero');
        }
        return value / params.divisor;
      }
      return value;

    case 'offset':
      if (params?.offset !== undefined) {
        return value + params.offset;
      }
      return value;

    case 'invert':
      if (params?.max !== undefined) {
        return params.max - value;
      }
      return value;

    case 'boolean':
      if (value === 'true' || value === 1 || value === true) {
        return true;
      }
      if (value === 'false' || value === 0 || value === false) {
        return false;
      }
      return Boolean(value);

    case 'round':
      const decimals = Math.max(0, params?.decimals ?? 0);
      return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

    // Legacy shortcuts
    case 'multiply_by_10':
      return value * 10;
    case 'multiply_by_100':
      return value * 100;
    case 'divide_by_10':
      return value / 10;
    case 'kg_to_lbs':
      return value * 2.20462;
    case 'lbs_to_kg':
      return value / 2.20462;
    case 'cm_to_m':
      return value / 100;
    case 'm_to_cm':
      return value * 100;
    case 'minutes_to_seconds':
      return value * 60;
    case 'seconds_to_minutes':
      return value / 60;

    default:
      return value;
  }
}
