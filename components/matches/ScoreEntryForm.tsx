'use client';

import { useState, useEffect } from 'react';
import type { MatchWithResult } from '@/lib/types/match';
import { submitMatchResult } from '@/lib/api/match-results';
import { calculateMatchOutcome } from '@/lib/utils/match-calculations';
import type { MatchOutcome } from '@/lib/types/match';

interface ScoreEntryFormProps {
  match: MatchWithResult;
  currentUserId: string;
  playerAHandicap: number;
  playerBHandicap: number;
  onSubmit: (playerAImp: number, playerBImp: number) => Promise<void>;
  onCancel?: () => void;
}

export default function ScoreEntryForm({
  match,
  currentUserId,
  playerAHandicap,
  playerBHandicap,
  onSubmit,
  onCancel,
}: ScoreEntryFormProps) {
  const [playerAImp, setPlayerAImp] = useState<string>(
    match.result?.player_a_imp_score.toString() || '0'
  );
  const [playerBImp, setPlayerBImp] = useState<string>(
    match.result?.player_b_imp_score.toString() || '0'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate outcome preview
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);

  useEffect(() => {
    const playerAImpNum = parseInt(playerAImp, 10) || 0;
    const playerBImpNum = parseInt(playerBImp, 10) || 0;
    const calculatedOutcome = calculateMatchOutcome(
      playerAImpNum,
      playerAHandicap,
      playerBImpNum,
      playerBHandicap
    );
    setOutcome(calculatedOutcome);
  }, [playerAImp, playerBImp, playerAHandicap, playerBHandicap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const playerAImpNum = parseInt(playerAImp, 10);
    const playerBImpNum = parseInt(playerBImp, 10);

    // Validate integers
    if (isNaN(playerAImpNum) || isNaN(playerBImpNum)) {
      setError('IMP scores must be valid integers');
      return;
    }

    setLoading(true);

    try {
      const { data, error: submitError } = await submitMatchResult(
        match.id,
        playerAImpNum,
        playerBImpNum
      );

      if (submitError || !data) {
        setError(submitError || 'Failed to submit match result');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Call the onSubmit callback
      await onSubmit(playerAImpNum, playerBImpNum);

      // Reset form after a short delay
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit match result');
      setLoading(false);
    }
  };

  const getOutcomeText = (): string => {
    if (!outcome) return '';
    if (outcome === 'player_a_wins') {
      return `${match.player_a_name || 'Player A'} wins`;
    } else if (outcome === 'player_b_wins') {
      return `${match.player_b_name || 'Player B'} wins`;
    } else {
      return 'Tie';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm">
          Score submitted successfully!
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {match.player_a_name || 'Player A'} (Handicap: {playerAHandicap})
          </label>
          <input
            type="number"
            value={playerAImp}
            onChange={(e) => {
              setPlayerAImp(e.target.value);
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {match.player_b_name || 'Player B'} (Handicap: {playerBHandicap})
          </label>
          <input
            type="number"
            value={playerBImp}
            onChange={(e) => {
              setPlayerBImp(e.target.value);
              setError(null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        {outcome && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-sm text-gray-600">
              <strong>Outcome:</strong> {getOutcomeText()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Final scores: {parseInt(playerAImp, 10) || 0} + {playerAHandicap} ={' '}
              {(parseInt(playerAImp, 10) || 0) + playerAHandicap} vs{' '}
              {parseInt(playerBImp, 10) || 0} + {playerBHandicap} ={' '}
              {(parseInt(playerBImp, 10) || 0) + playerBHandicap}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : match.result ? 'Update Score' : 'Submit Score'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

