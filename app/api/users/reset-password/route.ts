import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-utils';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
 * Generate a secure random password
 * Returns a 12-character password with letters and numbers
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * POST /api/users/reset-password - Reset a user's password (admin only)
 * Generates a temporary password and returns it to the admin
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
    const { userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { data: null, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (findError || !existingUser) {
      return NextResponse.json(
        { data: null, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    
    // Hash the password
    const passwordHash = await hashPassword(temporaryPassword);

    // Update user's password hash
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json(
        { data: null, error: updateError.message || 'Failed to reset password' },
        { status: 500 }
      );
    }

    // Return the temporary password (admin needs to share this with the user)
    return NextResponse.json({ 
      data: { 
        temporaryPassword,
        userName: existingUser.name 
      }, 
      error: null 
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { data: null, error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
