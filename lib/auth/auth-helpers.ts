/**
 * Authentication helper functions
 * Handles registration, login, logout, and session management
 */

import { supabase } from '@/lib/supabase/client';
import type { User, UserProfile, AuthError } from '@/lib/types/user';

export interface RegisterParams {
  email: string;
  password: string;
  username: string;
}

export interface LoginParams {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile | null;
  error: AuthError | null;
}

/**
 * Map Supabase auth errors to user-friendly messages
 */
function mapAuthError(error: any): AuthError {
  if (!error) {
    return { message: 'An unknown error occurred' };
  }

  // Handle specific Supabase error codes
  switch (error.message) {
    case 'Invalid login credentials':
    case 'Email not confirmed':
      return { message: 'Invalid email or password', code: error.status };
    case 'User already registered':
      return { message: 'An account with this email already exists', code: error.status };
    case 'Password should be at least 6 characters':
      return { message: 'Password must be at least 6 characters', code: error.status };
    default:
      return { message: error.message || 'An error occurred', code: error.status };
  }
}

/**
 * Register a new user
 * Uses Supabase Auth with email/password and stores username in metadata
 */
export async function register({
  email,
  password,
  username,
}: RegisterParams): Promise<AuthResponse> {
  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (authError) {
      return { user: null, error: mapAuthError(authError) };
    }

    if (!authData.user) {
      return {
        user: null,
        error: { message: 'Registration failed. Please try again.' },
      };
    }

    // Wait a moment for the trigger to sync user to public.users table
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Fetch the user profile from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      // User might not be synced yet, return auth user data
      return {
        user: {
          id: authData.user.id,
          username: username,
          email: email,
          role: 'player',
          handicap: 0,
        },
        error: null,
      };
    }

    return {
      user: {
        id: userData.id,
        username: userData.username,
        email: email,
        role: userData.role,
        handicap: userData.handicap,
      },
      error: null,
    };
  } catch (error: any) {
    return { user: null, error: mapAuthError(error) };
  }
}

/**
 * Login user with username and password
 * Looks up email by username, then authenticates with Supabase Auth
 */
export async function login({
  email,
  username,
  password,
}: LoginParams): Promise<AuthResponse> {
  try {
    let userEmail = email;

    // If username is provided instead of email, look up the email from users table
    if (username && !email) {
      const { data: userData, error: lookupError } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .single();

      if (lookupError || !userData || !userData.email) {
        return {
          user: null,
          error: { message: 'Invalid username or password' },
        };
      }

      userEmail = userData.email;
    }

    if (!userEmail) {
      return {
        user: null,
        error: { message: 'Username is required' },
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password,
    });

    if (authError) {
      return { user: null, error: mapAuthError(authError) };
    }

    if (!authData.user) {
      return {
        user: null,
        error: { message: 'Login failed. Please try again.' },
      };
    }

    // Fetch user profile from public.users table
    const userProfile = await getCurrentUser();

    return userProfile;
  } catch (error: any) {
    return { user: null, error: mapAuthError(error) };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: mapAuthError(error) };
    }

    return { error: null };
  } catch (error: any) {
    return { error: mapAuthError(error) };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: mapAuthError(error) };
    }

    return { session: data.session, error: null };
  } catch (error: any) {
    return { session: null, error: mapAuthError(error) };
  }
}

/**
 * Get current user with profile data
 * Combines auth user data with profile from public.users table
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return { user: null, error: null };
    }

    const userId = sessionData.session.user.id;

    // Fetch user profile from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      // User might not exist in public.users yet, use auth data
      return {
        user: {
          id: sessionData.session.user.id,
          username:
            sessionData.session.user.user_metadata?.username ||
            sessionData.session.user.email?.split('@')[0] ||
            'user',
          email: sessionData.session.user.email || '',
          role: 'player',
          handicap: 0,
        },
        error: null,
      };
    }

    return {
      user: {
        id: userData.id,
        username: userData.username,
        email: sessionData.session.user.email || '',
        role: userData.role,
        handicap: userData.handicap,
      },
      error: null,
    };
  } catch (error: any) {
    return { user: null, error: mapAuthError(error) };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: UserProfile | null) => void
) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { user } = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

