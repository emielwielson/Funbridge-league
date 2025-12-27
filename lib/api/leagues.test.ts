/**
 * Unit tests for leagues API functions
 */

import {
  getActiveLeague,
  getDraftLeague,
  createLeague,
  startLeague,
  finishLeague,
  getArchivedLeagues,
} from './leagues';
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

describe('Leagues API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveLeague', () => {
    it('should fetch active league successfully', async () => {
      const mockLeague = {
        id: 'league-1',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        finished_at: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockLeague,
          error: null,
        }),
      });

      const result = await getActiveLeague();

      expect(result.data).toEqual(mockLeague);
      expect(result.error).toBeNull();
    });

    it('should return null when no active league exists', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const result = await getActiveLeague();

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('getDraftLeague', () => {
    it('should fetch draft league successfully', async () => {
      const mockLeague = {
        id: 'league-1',
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        finished_at: null,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: mockLeague,
          error: null,
        }),
      });

      const result = await getDraftLeague();

      expect(result.data).toEqual(mockLeague);
      expect(result.error).toBeNull();
    });
  });

  describe('createLeague', () => {
    it('should create league successfully', async () => {
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

      // Mock draft league check (none exists)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Mock insert
      (supabase.from as jest.Mock).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'league-1',
            status: 'draft',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            finished_at: null,
          },
          error: null,
        }),
      });

      const result = await createLeague();

      expect(result.data).toBeTruthy();
      expect(result.data?.status).toBe('draft');
      expect(result.error).toBeNull();
    });

    it('should reject creation if draft league already exists', async () => {
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
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'existing-draft' },
          error: null,
        }),
      });

      const result = await createLeague();

      expect(result.data).toBeNull();
      expect(result.error).toContain('draft league already exists');
    });
  });

  describe('startLeague', () => {
    it('should start league successfully', async () => {
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

      // Mock active league check (none)
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
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

      // Mock update
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'league-1',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            finished_at: null,
          },
          error: null,
        }),
      });

      const result = await startLeague('league-1');

      expect(result.data).toBeTruthy();
      expect(result.data?.status).toBe('active');
      expect(result.error).toBeNull();
    });

    it('should reject starting if another league is active', async () => {
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
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'other-active-league' },
          error: null,
        }),
      });

      const result = await startLeague('league-1');

      expect(result.data).toBeNull();
      expect(result.error).toContain('already active');
    });
  });

  describe('finishLeague', () => {
    it('should finish league successfully', async () => {
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

      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'league-1',
            status: 'archived',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            finished_at: '2024-01-31T00:00:00Z',
          },
          error: null,
        }),
      });

      const result = await finishLeague('league-1');

      expect(result.data).toBeTruthy();
      expect(result.data?.status).toBe('archived');
      expect(result.data?.finished_at).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should reject finishing if league is not active', async () => {
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

      const result = await finishLeague('league-1');

      expect(result.data).toBeNull();
      expect(result.error).toContain('Only active leagues');
    });
  });

  describe('getArchivedLeagues', () => {
    it('should fetch archived leagues successfully', async () => {
      const mockLeagues = [
        {
          id: 'league-1',
          status: 'archived',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-31T00:00:00Z',
          finished_at: '2024-01-31T00:00:00Z',
        },
        {
          id: 'league-2',
          status: 'archived',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-02-28T00:00:00Z',
          finished_at: '2024-02-28T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockLeagues,
          error: null,
        }),
      });

      const result = await getArchivedLeagues();

      expect(result.data).toEqual(mockLeagues);
      expect(result.error).toBeNull();
    });
  });
});

