'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch active league
      const leagueResult = await getActiveLeague();
      if (leagueResult.error || !leagueResult.data) {
        setError(leagueResult.error || 'No active league found');
        setLoading(false);
        return;
      }

      setActiveLeague(leagueResult.data);

      // Fetch matches for current user
      const matchesResult = await getMatchesByPlayer(user.id, leagueResult.data.id);
      if (matchesResult.error) {
        setError(matchesResult.error);
        setLoading(false);
        return;
      }

      setMatches(matchesResult.data || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  return (
    <ProtectedRoute>
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
                  if (activeLeague) {
                    const matchesResult = await getMatchesByPlayer(user.id, activeLeague.id);
                    if (!matchesResult.error && matchesResult.data) {
                      setMatches(matchesResult.data);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

