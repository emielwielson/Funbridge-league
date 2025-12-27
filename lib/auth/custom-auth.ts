/**
 * Custom authentication system using database directly (no Supabase Auth)
 * Uses bcrypt for password hashing and JWT for sessions
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { User, UserProfile, AuthError } from '@/lib/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface RegisterParams {
  password: string;
  name: string;
  funbridge_username: string;
}

export interface LoginParams {
  name: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile | null;
  error: AuthError | null;
  token?: string;
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token for a user
 */
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please add it to your .env file.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function registerCustom({
  password,
  name,
  funbridge_username,
}: RegisterParams): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseClient();

    // Check if user with this name already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    // If we got a user (not an error from single() when no user found), name is taken
    if (existingUser) {
      return {
        user: null,
        error: { message: 'An account with this name already exists' },
      };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new user
    const { data: newUser, error: insertError } = await (supabase
      .from('users') as any)
      .insert({
        name: name,
        password_hash: passwordHash,
        funbridge_username: funbridge_username,
        role: 'player',
        handicap: 0,
      } as any)
      .select()
      .single();

    if (insertError || !newUser) {
      return {
        user: null,
        error: { message: insertError?.message || 'Registration failed' },
      };
    }

    // Generate JWT token
    const token = generateToken(newUser.id);

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        funbridge_username: newUser.funbridge_username,
        role: newUser.role,
        handicap: newUser.handicap,
      },
      error: null,
      token,
    };
  } catch (error: any) {
    return {
      user: null,
      error: { message: error.message || 'Registration failed' },
    };
  }
}

/**
 * Login user
 */
export async function loginCustom({
  name,
  password,
}: LoginParams): Promise<AuthResponse> {
  try {
    const supabase = getSupabaseClient();

    // Find user by name
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single<{ id: string; name: string; role: 'player' | 'admin'; password_hash: string; funbridge_username: string | null; handicap: number | null }>();

    if (findError || !user) {
      return {
        user: null,
        error: { message: 'Invalid name or password' },
      };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return {
        user: null,
        error: { message: 'Invalid name or password' },
      };
    }

    // Generate JWT token
    const token = generateToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        funbridge_username: user.funbridge_username ?? undefined,
        role: user.role as 'player' | 'admin',
        handicap: user.handicap ?? 0,
      },
      error: null,
      token,
    };
  } catch (error: any) {
    return {
      user: null,
      error: { message: error.message || 'Login failed' },
    };
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUserFromToken(
  token: string
): Promise<AuthResponse> {
  try {
    const decoded = verifyToken(token);

    if (!decoded) {
      return { user: null, error: { message: 'Invalid token' } };
    }

    const supabase = getSupabaseClient();
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single<{ id: string; name: string; role: 'player' | 'admin'; funbridge_username: string | null; handicap: number | null }>();

    if (findError || !user) {
      return { user: null, error: { message: 'User not found' } };
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        funbridge_username: user.funbridge_username ?? undefined,
        role: user.role as 'player' | 'admin',
        handicap: (user.handicap ?? 0) as number,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      error: { message: error.message || 'Failed to get user' },
    };
  }
}

