'use client';

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MatchList from '@/components/matches/MatchList';
import { getMatchesByPlayer } from '@/lib/api/matches';
import { getActiveLeague } from '@/lib/api/leagues';
import { useUser } from '@/lib/hooks/useUser';
import type { MatchWithResult } from '@/lib/types/match';
import type { League } from '@/lib/types/league';

export default function MatchesPage() {
  const user = useUser();
  const [matches, setMatches] = useState<MatchWithResult[]>([]);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if initial data has been loaded to prevent unnecessary re-fetches
  const initialLoadComplete = useRef(false);
  const lastFetchedUserId = useRef<string | null>(null);
  const lastFetchedLeagueId = useRef<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        // Reset tracking when user logs out
        initialLoadComplete.current = false;
        lastFetchedUserId.current = null;
        lastFetchedLeagueId.current = null;
        setActiveLeague(null);
        setMatches([]);
        return;
      }

      // Prevent re-fetching if user object reference changes but user hasn't actually changed
      if (
        initialLoadComplete.current &&
        lastFetchedUserId.current === user.id &&
        lastFetchedLeagueId.current
      ) {
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch active league
      const leagueResult = await getActiveLeague();
      if (leagueResult.error || !leagueResult.data) {
        setError(leagueResult.error || 'No active league found');
        setLoading(false);
        initialLoadComplete.current = true;
        return;
      }

      setActiveLeague(leagueResult.data);
      lastFetchedLeagueId.current = leagueResult.data.id;

      // Fetch matches for current user
      const matchesResult = await getMatchesByPlayer(user.id, leagueResult.data.id);
      if (matchesResult.error) {
        setError(matchesResult.error);
        setLoading(false);
        initialLoadComplete.current = true;
        return;
      }

      setMatches(matchesResult.data || []);
      lastFetchedUserId.current = user.id;
      setLoading(false);
      initialLoadComplete.current = true;
    };

    fetchData();
  }, [user?.id]); // Only depend on user.id, not the entire user object

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Matches</h2>
            <p className="mt-1 text-sm text-gray-600">
              View and enter scores for your matches
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading matches...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!loading && !error && !activeLeague && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              No active league. Matches will appear here once a league is started.
            </div>
          )}

          {!loading && !error && activeLeague && matches.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">
                You don't have any matches yet. Matches will be generated when the league starts.
              </p>
            </div>
          )}

          {!loading && !error && activeLeague && matches.length > 0 && user && (
            <div className="bg-white rounded-lg shadow p-6">
              <MatchList
                matches={matches}
                currentUserId={user.id}
                currentUserRole={user.role}
                onResultSubmit={async () => {
                  // Refresh matches after result submission
                  if (activeLeague && user) {
                    // Reset tracking refs to force a refresh
                    lastFetchedUserId.current = null;
                    lastFetchedLeagueId.current = null;
                    
                    const matchesResult = await getMatchesByPlayer(user.id, activeLeague.id);
                    if (!matchesResult.error && matchesResult.data) {
                      setMatches(matchesResult.data);
                      // Update refs after successful fetch
                      lastFetchedUserId.current = user.id;
                      lastFetchedLeagueId.current = activeLeague.id;
                    }
                  }
                }}
              />
            </div>
          )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

