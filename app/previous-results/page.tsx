'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getArchivedLeagues } from '@/lib/api/leagues';
import type { League } from '@/lib/types/league';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';
import Alert from '@/components/ui/Alert';
import LeagueResultsView from '@/components/results/LeagueResultsView';

export default function PreviousResultsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeagues = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getArchivedLeagues();

      if (fetchError) {
        setError(fetchError);
        setLoading(false);
        return;
      }

      setLeagues(data || []);
      setLoading(false);
    };

    fetchLeagues();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Skeleton height={32} className="mb-2" />
            <Skeleton height={16} width="60%" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <Skeleton height={24} className="mb-4" />
                <Skeleton height={16} width="40%" />
              </div>
            ))}
          </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="error" dismissible>
            {error}
          </Alert>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Previous Results</h1>
            <p className="mt-2 text-sm text-gray-600">
              View final results from completed leagues
            </p>
          </div>

        {leagues.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">No archived leagues found.</p>
            <p className="text-sm mt-2">Completed leagues will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leagues.map((league) => (
              <LeagueResultsView
                key={league.id}
                league={league}
                isExpanded={selectedLeagueId === league.id}
                onToggle={() =>
                  setSelectedLeagueId(
                    selectedLeagueId === league.id ? null : league.id
                  )
                }
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
