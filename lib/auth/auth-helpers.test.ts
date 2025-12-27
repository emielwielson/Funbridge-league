/**
 * Unit tests for authentication helper functions
 */

import { register, login, logout, getSession, getCurrentUser } from './auth-helpers';
import { supabase } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('Auth Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' },
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            username: 'testuser',
            role: 'player',
            handicap: 0,
          },
          error: null,
        }),
      });

      const result = await register({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      });

      expect(result.user).toBeTruthy();
      expect(result.user?.username).toBe('testuser');
      expect(result.user?.role).toBe('player');
      expect(result.error).toBeNull();
    });

    it('should handle registration errors', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered', status: 400 },
      });

      const result = await register({
        email: 'existing@example.com',
        password: 'password123',
        username: 'existing',
      });

      expect(result.user).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            username: 'testuser',
            role: 'player',
            handicap: 0,
          },
          error: null,
        }),
      });

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should handle invalid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const result = await login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.user).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await logout();

      expect(result.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Logout failed', status: 500 },
      });

      const result = await logout();

      expect(result.error).toBeTruthy();
    });
  });

  describe('getSession', () => {
    it('should get current session', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await getSession();

      expect(result.session).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should handle no session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getSession();

      expect(result.session).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user with profile', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-123',
            username: 'testuser',
            role: 'player',
            handicap: 0,
          },
          error: null,
        }),
      });

      const result = await getCurrentUser();

      expect(result.user).toBeTruthy();
      expect(result.user?.username).toBe('testuser');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.error).toBeNull();
    });

    it('should handle user not found in profile table', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' },
        },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      const result = await getCurrentUser();

      // Should fallback to auth user data
      expect(result.user).toBeTruthy();
      expect(result.user?.username).toBe('testuser');
    });
  });
});

