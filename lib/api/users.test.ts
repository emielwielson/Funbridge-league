/**
 * Unit tests for users API functions
 */

import {
  getAllUsers,
  promoteToAdmin,
  updateHandicap,
} from './users';
import { supabase } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should fetch all users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'player1',
          email: 'player1@example.com',
          role: 'player',
          handicap: 5,
        },
        {
          id: 'user-2',
          username: 'admin1',
          email: 'admin1@example.com',
          role: 'admin',
          handicap: 0,
        },
      ];

      // Mock no active league
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      });

      // Mock users query
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      });

      const result = await getAllUsers();

      expect(result.data).toEqual(mockUsers);
      expect(result.error).toBeNull();
    });

    it('should handle errors when fetching users', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const result = await getAllUsers();

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('promoteToAdmin', () => {
    it('should promote user to admin successfully', async () => {
      const mockSession = {
        user: { id: 'admin-user' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock current user check (admin)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      });

      // Mock update
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-1',
            username: 'player1',
            role: 'admin',
            handicap: 5,
          },
          error: null,
        }),
      });

      const result = await promoteToAdmin('user-1');

      expect(result.data).toBeTruthy();
      expect(result.data?.role).toBe('admin');
      expect(result.error).toBeNull();
    });

    it('should reject promotion if current user is not admin', async () => {
      const mockSession = {
        user: { id: 'player-user' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'player' },
          error: null,
        }),
      });

      const result = await promoteToAdmin('user-1');

      expect(result.data).toBeNull();
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('updateHandicap', () => {
    it('should update handicap successfully', async () => {
      const mockSession = {
        user: { id: 'admin-user' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'user-1',
            username: 'player1',
            role: 'player',
            handicap: 10,
          },
          error: null,
        }),
      });

      const result = await updateHandicap('user-1', 10);

      expect(result.data).toBeTruthy();
      expect(result.data?.handicap).toBe(10);
      expect(result.error).toBeNull();
    });

    it('should reject invalid handicap value', async () => {
      const result = await updateHandicap('user-1', NaN);

      expect(result.data).toBeNull();
      expect(result.error).toContain('valid number');
    });
  });
});

