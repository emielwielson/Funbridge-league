import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password.trim(), 10);
}

/**
 * POST /api/auth/change-password
 * Body: { currentPassword: string, newPassword: string }
 * Requires authenticated user. Verifies current password then updates to new password.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getCurrentUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'You must be logged in to change your password' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data: row, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.id)
      .maybeSingle<{ password_hash: string }>();

    if (fetchError || !row?.password_hash) {
      return NextResponse.json(
        { error: 'Could not verify current password' },
        { status: 500 }
      );
    }

    const currentOk = await bcrypt.compare(currentPassword, row.password_hash);
    if (!currentOk) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    const newHash = await hashPassword(newPassword);
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({ password_hash: newHash, updated_at: new Date().toISOString() } as any)
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
