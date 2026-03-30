/**
 * Athlete Portal Authentication API - FASE 4 ATHLETE PORTAL
 * 
 * POST /api/athlete-portal/auth
 * Authenticates an athlete and returns their profile.
 * 
 * This is a simplified auth for the athlete portal.
 * In production, you'd use Supabase Auth or similar.
 * 
 * Body:
 * {
 *   email: string,
 *   code?: string (optional PIN/code for athletes without accounts)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   athlete: {
 *     id: string,
 *     name: string,
 *     email: string,
 *     workspaceId: string,
 *     ...
 *   },
 *   token: string (for subsequent requests)
 * }
 * 
 * @author PerformTrack Team
 * @since Fase 4 - Athlete Portal Backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import jwt from 'jsonwebtoken';

// ============================================================================
// POST /api/athlete-portal/auth - Authenticate athlete
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // ==============================================================
    // Find athlete by email
    // ==============================================================
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select(`
        id,
        name,
        email,
        date_of_birth,
        avatar_url,
        metadata,
        workspace_id,
        user_id,
        is_active
      `)
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (athleteError) {
      console.error('Error finding athlete:', athleteError);
      return NextResponse.json(
        { error: 'Authentication failed', details: athleteError.message },
        { status: 500 }
      );
    }

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found or inactive' },
        { status: 404 }
      );
    }

    // ==============================================================
    // Optional: Check access code if athlete has one in metadata
    // ==============================================================
    if (athlete.metadata?.accessCode) {
      if (!code || code !== athlete.metadata.accessCode) {
        return NextResponse.json(
          { error: 'Invalid access code' },
          { status: 401 }
        );
      }
    }

    // ==============================================================
    // Get workspace info
    // ==============================================================
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, name, settings')
      .eq('id', athlete.workspace_id)
      .single();

    if (workspaceError || !workspace) {
      console.error('Error fetching workspace:', workspaceError);
    }

    // ==============================================================
    // Generate simple token (in production, use JWT or session)
    // ==============================================================
    // For now, we'll just return athlete.id as token
    // In production, you'd use: jwt.sign({ athleteId: athlete.id }, secret)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const token = jwt.sign(
      {
        athleteId: athlete.id,
        workspaceId: athlete.workspace_id,
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // ==============================================================
    // Return athlete profile
    // ==============================================================
    return NextResponse.json({
      success: true,
      athlete: {
        id: athlete.id,
        name: athlete.name,
        email: athlete.email,
        dateOfBirth: athlete.date_of_birth,
        avatarUrl: athlete.avatar_url,
        workspaceId: athlete.workspace_id,
        workspaceName: workspace?.name,
        metadata: athlete.metadata,
      },
      token,
      message: `Welcome back, ${athlete.name}!`,
    });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/athlete-portal/auth:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/athlete-portal/auth - Verify token
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Decode token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        jwtSecret
      ) as jwt.JwtPayload;
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { athleteId, workspaceId } = decoded;

    if (!athleteId || !workspaceId) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Verify athlete still exists and is active
    const { data: athlete, error } = await supabase
      .from('athletes')
      .select('id, name, email, avatar_url, workspace_id, is_active')
      .eq('id', athleteId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !athlete) {
      return NextResponse.json(
        { error: 'Athlete not found or inactive' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      athlete: {
        id: athlete.id,
        name: athlete.name,
        email: athlete.email,
        avatarUrl: athlete.avatar_url,
        workspaceId: athlete.workspace_id,
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/athlete-portal/auth:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
