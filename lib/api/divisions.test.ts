/**
 * Unit tests for divisions API functions
 */

import {
  getAllDivisions,
  createDivision,
  assignPlayerToDivision,
  removePlayerFromDivision,
} from './divisions';
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

describe('Divisions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDivisions', () => {
    it('should fetch all divisions successfully', async () => {
      const mockDivisions = [
        {
          id: 'div-1',
          name: 'Division A',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'div-2',
          name: 'Division B',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockDivisions,
          error: null,
        }),
      });

      const result = await getAllDivisions();

      expect(result.data).toEqual(mockDivisions);
      expect(result.error).toBeNull();
    });

    it('should handle errors when fetching divisions', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const result = await getAllDivisions();

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('createDivision', () => {
    it('should create division successfully', async () => {
      const mockSession = {
        user: { id: 'admin-user' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock admin check
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      });

      // Mock duplicate check
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        }),
      });

      // Mock insert
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'div-1',
            name: 'Division A',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          error: null,
        }),
      });

      const result = await createDivision('Division A');

      expect(result.data).toBeTruthy();
      expect(result.data?.name).toBe('Division A');
      expect(result.error).toBeNull();
    });

    it('should reject empty division name', async () => {
      const result = await createDivision('');

      expect(result.data).toBeNull();
      expect(result.error).toContain('required');
    });

    it('should reject duplicate division name', async () => {
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
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'existing-div' },
          error: null,
        }),
      });

      const result = await createDivision('Existing Division');

      expect(result.data).toBeNull();
      expect(result.error).toContain('already exists');
    });
  });

  describe('assignPlayerToDivision', () => {
    it('should assign player to division successfully', async () => {
      const mockSession = {
        user: { id: 'admin-user' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock admin check
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      });

      // Mock league status check (draft)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { status: 'draft' },
          error: null,
        }),
      });

      // Mock delete existing assignment
      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Mock insert new assignment
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      const result = await assignPlayerToDivision(
        'player-1',
        'div-1',
        'league-1'
      );

      expect(result.data).toBeTruthy();
      expect(result.data?.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject assignment when league is not in draft', async () => {
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
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { status: 'active' },
          error: null,
        }),
      });

      const result = await assignPlayerToDivision(
        'player-1',
        'div-1',
        'league-1'
      );

      expect(result.data).toBeNull();
      expect(result.error).toContain('draft status');
    });
  });

  describe('removePlayerFromDivision', () => {
    it('should remove player from division successfully', async () => {
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
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { status: 'draft' },
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      const result = await removePlayerFromDivision('player-1', 'league-1');

      expect(result.data).toBeTruthy();
      expect(result.data?.success).toBe(true);
      expect(result.error).toBeNull();
    });
  });
});

