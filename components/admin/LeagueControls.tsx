'use client';

import { useState, useEffect } from 'react';
import {
  getActiveLeague,
  getDraftLeague,
  createLeague,
  startLeague,
  finishLeague,
} from '@/lib/api/leagues';
import type { League } from '@/lib/types/league';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';

interface LeagueControlsProps {
  onLeagueChange?: () => void;
}

export default function LeagueControls({ onLeagueChange }: LeagueControlsProps) {
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [draftLeague, setDraftLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLeagues = async () => {
    setLoading(true);
    setError(null);

    try {
      const [activeResult, draftResult] = await Promise.all([
        getActiveLeague(),
        getDraftLeague(),
      ]);

      if (activeResult.error) {
        setError(activeResult.error);
        setLoading(false);
        return;
      }

      if (draftResult.error) {
        setError(draftResult.error);
        setLoading(false);
        return;
      }

      setActiveLeague(activeResult.data);
      setDraftLeague(draftResult.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagues();
  }, []);

  const handleCreateLeague = async () => {
    if (!confirm('Create a new draft league? This will allow you to set up divisions and assign players.')) {
      return;
    }

    setActionLoading('create');
    setError(null);

    const { data, error: createError } = await createLeague();

    if (createError || !data) {
      setError(createError || 'Failed to create league');
      setActionLoading(null);
      return;
    }

    setDraftLeague(data);
    setActionLoading(null);
    if (onLeagueChange) {
      onLeagueChange();
    }
  };

  const handleStartLeague = async () => {
    if (!draftLeague) return;

    if (
      !confirm(
        'Start the league? This will make it active and prevent further changes to divisions and player assignments. Make sure all players are assigned to divisions before starting.'
      )
    ) {
      return;
    }

    setActionLoading('start');
    setError(null);

    const { data, error: startError } = await startLeague(draftLeague.id);

    if (startError || !data) {
      setError(startError || 'Failed to start league');
      setActionLoading(null);
      return;
    }

    setActiveLeague(data);
    setDraftLeague(null);
    setActionLoading(null);
    if (onLeagueChange) {
      onLeagueChange();
    }
  };

  const handleFinishLeague = async () => {
    if (!activeLeague) return;

    if (
      !confirm(
        'Finish the league? This will archive it and make it read-only. This action cannot be undone.'
      )
    ) {
      return;
    }

    setActionLoading('finish');
    setError(null);

    const { data, error: finishError } = await finishLeague(activeLeague.id);

    if (finishError || !data) {
      setError(finishError || 'Failed to finish league');
      setActionLoading(null);
      return;
    }

    setActiveLeague(null);
    setActionLoading(null);
    if (onLeagueChange) {
      onLeagueChange();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton height={24} className="mb-4" />
        <div className="space-y-4">
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={44} width={200} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">League Status</h3>

        {activeLeague ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-green-600">Active</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm text-gray-900">
                {new Date(activeLeague.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleFinishLeague}
              loading={actionLoading === 'finish'}
              disabled={actionLoading === 'finish'}
            >
              Finish League
            </Button>
          </div>
        ) : draftLeague ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-yellow-600">Draft</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm text-gray-900">
                {new Date(draftLeague.created_at).toLocaleString()}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleStartLeague}
              loading={actionLoading === 'start'}
              disabled={actionLoading === 'start'}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              Start League
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">No league exists. Create a new draft league to get started.</p>
            <Button
              variant="primary"
              onClick={handleCreateLeague}
              loading={actionLoading === 'create'}
              disabled={actionLoading === 'create'}
            >
              Create New League
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

