/**
 * Athlete Portal - Submit Form API - FASE 4 ATHLETE PORTAL
 * 
 * POST /api/athlete-portal/forms/[id]/submit
 * Submits a form response from an athlete.
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * Body:
 * {
 *   responses: { [fieldKey]: any }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   submission: { id, form_id, athlete_id, ... },
 *   metricsCreated: number,
 *   message: string
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 4 - Athlete Portal Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import jwt from 'jsonwebtoken';

// Helper to extract athlete from token
async function getAthleteFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as jwt.JwtPayload;
    return { athleteId: decoded.athleteId, workspaceId: decoded.workspaceId };
  } catch {
    return null;
  }
}

interface SubmitParams {
  params: Promise<{
    id: string;
  }>;
}

// ============================================================================
// POST /api/athlete-portal/forms/[id]/submit - Submit form
// ============================================================================
export async function POST(
  request: NextRequest,
  { params }: SubmitParams
) {
  try {
    const { id: formId } = await params;
    const auth = await getAthleteFromToken(request);

    if (!auth || !auth.athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }

    const { athleteId, workspaceId } = auth;
    const body = await request.json();
    const { responses } = body;

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Invalid responses format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ==============================================================
    // STEP 1: Verify form exists and athlete belongs to workspace
    // ==============================================================
    // SEC-002 Ensure workspace isolation
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found or unauthorized' },
        { status: 404 }
      );
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found or inactive' },
        { status: 404 }
      );
    }

    // ==============================================================
    // STEP 2: Validate responses against form fields
    // ==============================================================
    const fields = form.fields || [];
    const validationErrors: string[] = [];

    fields.forEach((field: any) => {
      const value = responses[field.key];
      
      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        validationErrors.push(`Field "${field.label}" is required`);
      }

      // Type validation
      if (value !== undefined && value !== null) {
        switch (field.type) {
          case 'number':
            if (typeof value !== 'number' && isNaN(parseFloat(value))) {
              validationErrors.push(`Field "${field.label}" must be a number`);
            }
            break;
          case 'scale':
            const num = parseFloat(value);
            if (isNaN(num) || num < field.min || num > field.max) {
              validationErrors.push(
                `Field "${field.label}" must be between ${field.min} and ${field.max}`
              );
            }
            break;
        }
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // ==============================================================
    // STEP 3: Create form submission via internal API
    // ==============================================================
    const submissionResponse = await fetch(
      `${request.nextUrl.origin}/api/form-submissions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          athleteId,
          responses,
        }),
      }
    );

    if (!submissionResponse.ok) {
      const errorData = await submissionResponse.json();
      return NextResponse.json(
        { 
          error: 'Failed to create submission', 
          details: errorData.error || errorData.message 
        },
        { status: 500 }
      );
    }

    const submissionData = await submissionResponse.json();

    // ==============================================================
    // RETURN SUCCESS
    // ==============================================================
    return NextResponse.json({
      success: true,
      submission: submissionData.submission,
      metricsCreated: submissionData.stats?.metricsCreated || 0,
      message: `Form "${form.name}" submitted successfully`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in POST /api/athlete-portal/forms/[id]/submit:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit form',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
