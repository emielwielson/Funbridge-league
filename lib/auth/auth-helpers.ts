/**
 * Authentication helper functions
 * Uses custom authentication (database + JWT) instead of Supabase Auth
 */

import {
  registerCustom,
  loginCustom,
  getCurrentUserFromToken,
  verifyToken,
} from './custom-auth';
import type { UserProfile, AuthError } from '@/lib/types/user';

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
}

// Cookies are managed server-side via API routes for security (HTTP-only cookies)

/**
 * Register a new user
 */
export async function register({
  password,
  name,
  funbridge_username,
}: RegisterParams): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password, name, funbridge_username }),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      return {
        user: null,
        error: { message: 'Server error: Invalid response format. Please check server logs and ensure SUPABASE_SERVICE_ROLE_KEY is set.' },
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        user: null,
        error: { message: data.error || 'Registration failed' },
      };
    }

    return {
      user: data.user,
      error: null,
    };
  } catch (error: any) {
    console.error('Registration fetch error:', error);
    return {
      user: null,
      error: { message: error.message || 'Registration failed. Please check your connection and try again.' },
    };
  }
}

/**
 * Login user
 */
export async function login({ name, password }: LoginParams): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        user: null,
        error: { message: data.error || 'Login failed' },
      };
    }

    return {
      user: data.user,
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      error: { message: error.message || 'Login failed' },
    };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<{ error: AuthError | null }> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return { error: null };
  } catch (error: any) {
    return { error: { message: error.message || 'Logout failed' } };
  }
}

/**
 * Get current session (returns user if authenticated)
 */
export async function getSession() {
  const { user } = await getCurrentUser();
  
  if (!user) {
    return { session: null, error: null };
  }

  return { session: { userId: user.id }, error: null };
}

/**
 * Get current user with profile data
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (data.error) {
      return { user: null, error: { message: data.error } };
    }

    return {
      user: data.user,
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      error: { message: error.message || 'Failed to get user' },
    };
  }
}

/**
 * Listen to auth state changes
 * Note: With custom auth, we'll need to poll or use a different mechanism
 */
export function onAuthStateChange(
  callback: (user: UserProfile | null) => void
) {
  // For custom auth, we'll check periodically
  const checkAuth = async () => {
    const { user } = await getCurrentUser();
    callback(user);
  };

  // Check immediately
  checkAuth();

  // Check every 30 seconds
  const interval = setInterval(checkAuth, 30000);

  // Return unsubscribe function
  return {
    data: {
      subscription: {
        unsubscribe: () => clearInterval(interval),
      },
    },
  };
}
