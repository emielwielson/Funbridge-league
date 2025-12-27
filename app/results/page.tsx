'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MatchList from '@/components/matches/MatchList';
import RankingsTable from '@/components/rankings/RankingsTable';
import { getMatchesByDivision } from '@/lib/api/matches';
import { getRankingsForDivision } from '@/lib/api/rankings';
import { getActiveLeague } from '@/lib/api/leagues';
import { getAllDivisions } from '@/lib/api/divisions';
import { useUser } from '@/lib/hooks/useUser';
import type { MatchWithResult } from '@/lib/types/match';
import type { PlayerRanking } from '@/lib/types/rankings';
import type { League } from '@/lib/types/league';
import type { Division } from '@/lib/types/division';

export default function ResultsPage() {
  const user = useUser();
  const [matches, setMatches] = useState<MatchWithResult[]>([]);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [userDivisionId, setUserDivisionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Fetch active league and divisions in parallel
      const [leagueResult, divisionsResult] = await Promise.all([
        getActiveLeague(),
        getAllDivisions(),
      ]);

      if (leagueResult.error || !leagueResult.data) {
        setError(leagueResult.error || 'No active league found');
        setLoading(false);
        return;
      }

      setActiveLeague(leagueResult.data);

      if (divisionsResult.error) {
        setError(divisionsResult.error);
        setLoading(false);
        return;
      }

      setDivisions(divisionsResult.data || []);

      // Fetch current user's division assignment
      try {
        const response = await fetch(
          `/api/users/division?leagueId=${encodeURIComponent(leagueResult.data.id)}`,
          {
            method: 'GET',
            credentials: 'include',
          }
        );

        const divisionData = await response.json();
        if (divisionData.data?.division_id) {
          setUserDivisionId(divisionData.data.division_id);
          setSelectedDivisionId(divisionData.data.division_id);
        }
      } catch (err) {
        // Non-critical error, continue without division pre-selection
        console.error('Failed to fetch user division:', err);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeLeague || !selectedDivisionId) {
        return;
      }

      setLoading(true);
      setRankingsLoading(true);

      // Fetch matches and rankings in parallel
      const [matchesResult, rankingsResult] = await Promise.all([
        getMatchesByDivision(selectedDivisionId, activeLeague.id),
        getRankingsForDivision(selectedDivisionId, activeLeague.id),
      ]);

      if (matchesResult.error) {
        setError(matchesResult.error);
      } else {
        setMatches(matchesResult.data || []);
        setError(null);
      }

      if (rankingsResult.error) {
        // Rankings error is non-critical, just log it
        console.error('Failed to fetch rankings:', rankingsResult.error);
        setRankings([]);
      } else {
        setRankings(rankingsResult.data || []);
      }

      setLoading(false);
      setRankingsLoading(false);
    };

    if (activeLeague && selectedDivisionId) {
      fetchData();
    }
    // Only fetch when division changes, not automatically
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeague?.id, selectedDivisionId]);

  const handleDivisionChange = (divisionId: string) => {
    setSelectedDivisionId(divisionId);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Results & Rankings</h2>
              <p className="mt-1 text-sm text-gray-600">
                View match results and current league rankings
              </p>
            </div>

          {loading && !activeLeague && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!loading && !error && !activeLeague && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              No active league. Results will appear here once a league is started.
            </div>
          )}

          {!loading && !error && activeLeague && (
            <>
              {/* Division Selector */}
              {divisions.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Division
                  </label>
                  <select
                    value={selectedDivisionId || ''}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                    style={{ color: 'black', backgroundColor: 'white' }}
                  >
                    {divisions.map((division) => (
                      <option key={division.id} value={division.id}>
                        {division.name}
                        {division.id === userDivisionId ? ' (Your Division)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Matches Section */}
              {selectedDivisionId && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Matches</h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-600">Loading matches...</div>
                    </div>
                  ) : matches.length === 0 ? (
                    <p className="text-gray-600">
                      No matches found for this division.
                    </p>
                  ) : user ? (
                    <MatchList
                      matches={matches}
                      currentUserId={user.id}
                      currentUserRole={user.role}
                      onResultSubmit={async () => {
                        // Refresh matches and rankings after result submission
                        if (activeLeague && selectedDivisionId) {
                          // Add a small delay to ensure the database update has propagated
                          await new Promise(resolve => setTimeout(resolve, 300));
                          
                          setLoading(true);
                          setRankingsLoading(true);
                          
                          try {
                            console.log('Refreshing matches and rankings...');
                            const [matchesResult, rankingsResult] = await Promise.all([
                              getMatchesByDivision(selectedDivisionId, activeLeague.id),
                              getRankingsForDivision(selectedDivisionId, activeLeague.id),
                            ]);
                            
                            console.log('Matches result:', matchesResult);
                            console.log('Rankings result:', rankingsResult);
                            
                            if (!matchesResult.error && matchesResult.data) {
                              console.log('Updating matches state with', matchesResult.data.length, 'matches');
                              console.log('Match data structure:', JSON.stringify(matchesResult.data, null, 2));
                              // Log each match's result status
                              matchesResult.data.forEach((match: any) => {
                                console.log(`Match ${match.id}: has result =`, !!match.result, 'result =', match.result);
                              });
                              setMatches(matchesResult.data);
                            } else if (matchesResult.error) {
                              console.error('Failed to refresh matches:', matchesResult.error);
                              setError(matchesResult.error);
                            }
                            
                            if (!rankingsResult.error && rankingsResult.data) {
                              console.log('Updating rankings state with', rankingsResult.data.length, 'rankings');
                              setRankings(rankingsResult.data);
                            } else if (rankingsResult.error) {
                              console.error('Failed to refresh rankings:', rankingsResult.error);
                            }
                          } catch (error) {
                            console.error('Error refreshing data:', error);
                            setError('Failed to refresh data after score submission');
                          } finally {
                            setLoading(false);
                            setRankingsLoading(false);
                          }
                        }
                      }}
                    />
                  ) : null}
                </div>
              )}

              {/* Rankings Section */}
              {selectedDivisionId && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Rankings</h3>
                  <RankingsTable rankings={rankings} loading={rankingsLoading} />
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
