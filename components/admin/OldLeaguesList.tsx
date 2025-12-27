'use client';

import { useState, useEffect } from 'react';
import { getArchivedLeagues } from '@/lib/api/leagues';
import type { League } from '@/lib/types/league';

export default function OldLeaguesList() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getArchivedLeagues();

      if (fetchError || !data) {
        setError(fetchError || 'Failed to load archived leagues');
        setLoading(false);
        return;
      }

      setLeagues(data);
      setLoading(false);
    };

    fetchLeagues();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading archived leagues...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        No archived leagues found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Archived Leagues</h3>
        <p className="mt-1 text-sm text-gray-500">
          These leagues are read-only. View historical league data.
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {leagues.map((league) => (
          <div
            key={league.id}
            className="px-6 py-4 bg-gray-50 opacity-75"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  League {league.id.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(league.created_at).toLocaleDateString()}
                  {league.finished_at && (
                    <> • Finished: {new Date(league.finished_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                Archived
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

