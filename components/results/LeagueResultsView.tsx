'use client';

import { useState, useEffect } from 'react';
import { getRankingsForDivision } from '@/lib/api/rankings';
import type { League } from '@/lib/types/league';
import type { Division } from '@/lib/types/division';
import type { PlayerRanking } from '@/lib/types/rankings';
import RankingsTable from '@/components/rankings/RankingsTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import Skeleton from '@/components/ui/Skeleton';

interface LeagueResultsViewProps {
  league: League;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function LeagueResultsView({
  league,
  isExpanded,
  onToggle,
}: LeagueResultsViewProps) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [rankingsByDivision, setRankingsByDivision] = useState<
    Record<string, PlayerRanking[]>
  >({});
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded && divisions.length === 0) {
      fetchDivisions();
    }
  }, [isExpanded, league.id]);

  // Reset divisions when league changes
  useEffect(() => {
    setDivisions([]);
    setRankingsByDivision({});
    setError(null);
  }, [league.id]);

  const fetchDivisions = async () => {
    setLoadingDivisions(true);
    setError(null);

    try {
      // Fetch unique divisions that have players assigned in this league
      const response = await fetch(
        `/api/divisions/by-league?leagueId=${encodeURIComponent(league.id)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch divisions');
        setLoadingDivisions(false);
        return;
      }

      const fetchedDivisions = data.data || [];
      setDivisions(fetchedDivisions);

      // Fetch rankings for each division
      fetchedDivisions.forEach((division: Division) => {
        fetchRankingsForDivision(division.id);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch divisions');
    } finally {
      setLoadingDivisions(false);
    }
  };

  const fetchRankingsForDivision = async (divisionId: string) => {
    setLoadingRankings((prev) => ({ ...prev, [divisionId]: true }));

    try {
      const { data, error: rankingsError } = await getRankingsForDivision(
        divisionId,
        league.id
      );

      if (rankingsError || !data) {
        console.error(`Failed to fetch rankings for division ${divisionId}:`, rankingsError);
        setRankingsByDivision((prev) => ({ ...prev, [divisionId]: [] }));
        return;
      }

      setRankingsByDivision((prev) => ({ ...prev, [divisionId]: data }));
    } catch (err: any) {
      console.error(`Error fetching rankings for division ${divisionId}:`, err);
      setRankingsByDivision((prev) => ({ ...prev, [divisionId]: [] }));
    } finally {
      setLoadingRankings((prev) => ({ ...prev, [divisionId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              League Finished: {league.finished_at ? formatDate(league.finished_at) : 'Unknown'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Created: {formatDate(league.created_at)}
            </p>
          </div>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4">
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {loadingDivisions ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i}>
                  <Skeleton height={24} className="mb-3" />
                  <Skeleton height={200} />
                </div>
              ))}
            </div>
          ) : divisions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No divisions found for this league.
            </div>
          ) : (
            <div className="space-y-8">
              {divisions.map((division) => (
                <div key={division.id}>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    {division.name}
                  </h4>
                  {loadingRankings[division.id] ? (
                    <RankingsTable rankings={[]} loading={true} />
                  ) : (
                    <RankingsTable
                      rankings={rankingsByDivision[division.id] || []}
                      loading={false}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
