import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { MatchResult } from '@/lib/types/match';

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
 * POST /api/match-results - Submit or update a match result
 * Players can submit/update results for their own matches
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { matchId, playerAImpScore, playerBImpScore } = body;

    if (!matchId || typeof matchId !== 'string') {
      return NextResponse.json(
        { data: null, error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Validate IMP scores are integers
    if (
      typeof playerAImpScore !== 'number' ||
      typeof playerBImpScore !== 'number' ||
      !Number.isInteger(playerAImpScore) ||
      !Number.isInteger(playerBImpScore)
    ) {
      return NextResponse.json(
        { data: null, error: 'IMP scores must be integers' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch the match to verify it exists and user is part of it
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, player_a_id, player_b_id, league_id, leagues(status)')
      .eq('id', matchId)
      .single() as any;

    if (matchError || !match) {
      return NextResponse.json(
        { data: null, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this match
    if (match.player_a_id !== user.id && match.player_b_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden: You can only enter scores for matches you are part of' },
        { status: 403 }
      );
    }

    // Verify league is active (not archived)
    if (match.leagues?.status === 'archived') {
      return NextResponse.json(
        { data: null, error: 'Cannot enter scores for archived leagues' },
        { status: 400 }
      );
    }

    // Check if result already exists
    const { data: existingResult } = await supabase
      .from('match_results')
      .select('id')
      .eq('match_id', matchId)
      .maybeSingle<{ id: string }>();

    if (existingResult) {
      // Update existing result
      const { data: updatedResult, error: updateError } = await (supabase
        .from('match_results') as any)
        .update({
          player_a_imp_score: playerAImpScore,
          player_b_imp_score: playerBImpScore,
          entered_by_user_id: user.id,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', existingResult.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { data: null, error: updateError.message || 'Failed to update match result' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: updatedResult, error: null });
    } else {
      // Insert new result
      const { data: newResult, error: insertError } = await (supabase
        .from('match_results') as any)
        .insert({
          match_id: matchId,
          player_a_imp_score: playerAImpScore,
          player_b_imp_score: playerBImpScore,
          entered_by_user_id: user.id,
        } as any)
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { data: null, error: insertError.message || 'Failed to create match result' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: newResult, error: null });
    }
  } catch (error: any) {
    console.error('Submit match result error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to submit match result' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/match-results - Update a match result (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAdmin(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: authError?.includes('Forbidden') ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { matchResultId, playerAImpScore, playerBImpScore } = body;

    if (!matchResultId || typeof matchResultId !== 'string') {
      return NextResponse.json(
        { data: null, error: 'Match result ID is required' },
        { status: 400 }
      );
    }

    // Validate IMP scores are integers
    if (
      typeof playerAImpScore !== 'number' ||
      typeof playerBImpScore !== 'number' ||
      !Number.isInteger(playerAImpScore) ||
      !Number.isInteger(playerBImpScore)
    ) {
      return NextResponse.json(
        { data: null, error: 'IMP scores must be integers' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch the match result to get the match and verify league status
    const { data: matchResult, error: fetchError } = await supabase
      .from('match_results')
      .select('id, match_id, matches(league_id, leagues(status))')
      .eq('id', matchResultId)
      .single() as any;

    if (fetchError || !matchResult) {
      return NextResponse.json(
        { data: null, error: 'Match result not found' },
        { status: 404 }
      );
    }

    // Verify league is not archived
    if (matchResult.matches?.leagues?.status === 'archived') {
      return NextResponse.json(
        { data: null, error: 'Cannot edit results for archived leagues' },
        { status: 400 }
      );
    }

    // Update the result
    const { data: updatedResult, error: updateError } = await (supabase
      .from('match_results') as any)
      .update({
        player_a_imp_score: playerAImpScore,
        player_b_imp_score: playerBImpScore,
        entered_by_user_id: user.id,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', matchResultId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message || 'Failed to update match result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedResult, error: null });
  } catch (error: any) {
    console.error('Update match result error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to update match result' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/match-results - Get match result for a specific match
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { data: null, error: 'Match ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch the match to verify user has access
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, player_a_id, player_b_id')
      .eq('id', matchId)
      .single<{ id: string; player_a_id: string; player_b_id: string }>();

    if (matchError || !match) {
      return NextResponse.json(
        { data: null, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Verify user is part of this match (unless admin)
    if (user.role !== 'admin' && match.player_a_id !== user.id && match.player_b_id !== user.id) {
      return NextResponse.json(
        { data: null, error: 'Forbidden: You can only access results for your matches' },
        { status: 403 }
      );
    }

    // Fetch the match result
    const { data: result, error: resultError } = await supabase
      .from('match_results')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();

    if (resultError) {
      return NextResponse.json(
        { data: null, error: resultError.message || 'Failed to fetch match result' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result || null, error: null });
  } catch (error: any) {
    console.error('Get match result error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to fetch match result' },
      { status: 500 }
    );
  }
}

