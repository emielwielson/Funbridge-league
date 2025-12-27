/**
 * Shared authentication utilities for API routes
 */

import { NextRequest } from 'next/server';
import { verifyToken, getCurrentUserFromToken } from '@/lib/auth/custom-auth';
import type { UserProfile } from '@/lib/types/user';

export interface AuthResult {
  user: UserProfile | null;
  error: string | null;
}

/**
 * Get current user from request (extracts JWT from cookies)
 */
export async function getCurrentUserFromRequest(
  request: NextRequest
): Promise<AuthResult> {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return { user: null, error: 'No authentication token' };
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return { user: null, error: 'Invalid token' };
  }
  
  const result = await getCurrentUserFromToken(token);
  return { 
    user: result.user, 
    error: result.error?.message || null 
  };
}

/**
 * Require admin access - returns user if admin, error otherwise
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthResult> {
  const { user, error } = await getCurrentUserFromRequest(request);
  
  if (error || !user) {
    return { user: null, error: error || 'Unauthorized' };
  }
  
  if (user.role !== 'admin') {
    return { user: null, error: 'Forbidden: Admin access required' };
  }
  
  return { user, error: null };
}

