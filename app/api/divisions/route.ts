import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, getCurrentUserFromRequest } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { Division } from '@/lib/types/division';

export const runtime = 'nodejs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * GET /api/divisions - Get all divisions
 */
export async function GET(request: NextRequest) {
  try {
    // All authenticated users can read divisions
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: divisions, error: divisionsError } = await supabase
      .from('divisions')
      .select('*')
      .order('name', { ascending: true });

    if (divisionsError) {
      return NextResponse.json(
        { data: null, error: divisionsError.message || 'Failed to fetch divisions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: divisions || [], error: null });
  } catch (error: any) {
    console.error('Get divisions error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch divisions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/divisions - Create a new division (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: authError?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { data: null, error: 'Division name is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('divisions')
      .select('id')
      .eq('name', name.trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { data: null, error: 'A division with this name already exists' },
        { status: 400 }
      );
    }

    // Create division
    const { data: division, error: createError } = await supabase
      .from('divisions')
      .insert({ name: name.trim() } as any)
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { data: null, error: createError.message || 'Failed to create division' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: division, error: null });
  } catch (error: any) {
    console.error('Create division error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to create division' },
      { status: 500 }
    );
  }
}

