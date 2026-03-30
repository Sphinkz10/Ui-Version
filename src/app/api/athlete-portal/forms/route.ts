/**
 * Athlete Portal - Forms API - FASE 4 ATHLETE PORTAL
 * 
 * GET /api/athlete-portal/forms
 * Returns forms available to the athlete.
 * 
 * Query params:
 * - status?: 'active' | 'inactive' - filter by form status
 * - includeSubmitted?: boolean (default: false) - include forms already submitted
 * 
 * Headers:
 * - Authorization: Bearer <token>
 * 
 * POST /api/athlete-portal/forms/[id]/submit
 * Submit a form response.
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

// ============================================================================
// GET /api/athlete-portal/forms - Get available forms
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const auth = await getAthleteFromToken(request);

    if (!auth || !auth.athleteId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }
    const { athleteId, workspaceId } = auth;

    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const includeSubmitted = searchParams.get('includeSubmitted') === 'true';

    const supabase = await createClient();

    // ==============================================================
    // STEP 1: Verify athlete belongs to workspace
    // ==============================================================
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('id', athleteId)
      .eq('workspace_id', workspaceId) // SEC-002 Ensure workspace isolation
      .single();

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found or unauthorized' },
        { status: 404 }
      );
    }

    // ==============================================================
    // STEP 2: Get forms for this workspace
    // ==============================================================
    let formsQuery = supabase
      .from('forms')
      .select(`
        id,
        name,
        description,
        type,
        status,
        fields,
        frequency,
        created_at,
        updated_at
      `)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (status) {
      formsQuery = formsQuery.eq('status', status);
    }

    const { data: forms, error: formsError } = await formsQuery;

    if (formsError) {
      console.error('Error fetching forms:', formsError);
      return NextResponse.json(
        { error: 'Failed to fetch forms', details: formsError.message },
        { status: 500 }
      );
    }

    // ==============================================================
    // STEP 3: Check which forms athlete has already submitted
    // ==============================================================
    const { data: submissions } = await supabase
      .from('form_submissions')
      .select('form_id, submitted_at')
      .eq('athlete_id', athleteId);

    const submissionsMap = new Map();
    (submissions || []).forEach((sub: any) => {
      if (!submissionsMap.has(sub.form_id)) {
        submissionsMap.set(sub.form_id, []);
      }
      submissionsMap.get(sub.form_id).push(sub.submitted_at);
    });

    // ==============================================================
    // STEP 4: Enrich forms with submission status
    // ==============================================================
    let enrichedForms = (forms || []).map((form: any) => {
      const submissions = submissionsMap.get(form.id) || [];
      const lastSubmission = submissions.length > 0 
        ? submissions.sort().reverse()[0] 
        : null;

      // Determine if form needs to be filled based on frequency
      let needsSubmission = true;
      if (lastSubmission && form.frequency) {
        const lastSubDate = new Date(lastSubmission);
        const now = new Date();
        
        switch (form.frequency) {
          case 'daily':
            needsSubmission = lastSubDate.toDateString() !== now.toDateString();
            break;
          case 'weekly':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            needsSubmission = lastSubDate < weekAgo;
            break;
          case 'monthly':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            needsSubmission = lastSubDate < monthAgo;
            break;
          case 'once':
            needsSubmission = false;
            break;
          default:
            needsSubmission = true;
        }
      }

      return {
        id: form.id,
        name: form.name,
        description: form.description,
        type: form.type,
        status: form.status,
        fields: form.fields,
        frequency: form.frequency,
        submissionCount: submissions.length,
        lastSubmission,
        needsSubmission,
        createdAt: form.created_at,
      };
    });

    // Filter out already submitted forms if requested
    if (!includeSubmitted) {
      enrichedForms = enrichedForms.filter(f => f.needsSubmission);
    }

    // ==============================================================
    // RETURN FORMS
    // ==============================================================
    return NextResponse.json({
      forms: enrichedForms,
      stats: {
        total: enrichedForms.length,
        needsSubmission: enrichedForms.filter(f => f.needsSubmission).length,
        completed: enrichedForms.filter(f => !f.needsSubmission).length,
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athlete-portal/forms:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
