'use client';

import { useState, useEffect } from 'react';
import type { MatchWithResult } from '@/lib/types/match';
import { submitMatchResult } from '@/lib/api/match-results';
import { calculateMatchOutcome } from '@/lib/utils/match-calculations';
import type { MatchOutcome } from '@/lib/types/match';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
      
      // Call the onSubmit callback to refresh data (keep loading true during refresh)
      try {
        await onSubmit(playerAImpNum, playerBImpNum);
      } catch (refreshError: any) {
        console.error('Error refreshing data after submission:', refreshError);
        // Don't show error to user if submission was successful, just log it
      } finally {
        setLoading(false);
      }

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
    const playerAName = match.player_a_name || 'Player A';
    const playerBName = match.player_b_name || 'Player B';
    const playerAFunbridge = match.player_a_funbridge_username ? ` (${match.player_a_funbridge_username})` : '';
    const playerBFunbridge = match.player_b_funbridge_username ? ` (${match.player_b_funbridge_username})` : '';
    
    if (outcome === 'player_a_wins') {
      return `${playerAName}${playerAFunbridge} wins`;
    } else if (outcome === 'player_b_wins') {
      return `${playerBName}${playerBFunbridge} wins`;
    } else {
      return 'Tie';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" autoDismiss={2000} onDismiss={() => setSuccess(false)}>
          Score submitted successfully!
        </Alert>
      )}

      <div className="space-y-3">
        <Input
          type="number"
          label={`${match.player_a_name || 'Player A'}${match.player_a_funbridge_username ? ` (${match.player_a_funbridge_username})` : ''} (Handicap: ${playerAHandicap})`}
          value={playerAImp}
          onChange={(e) => {
            setPlayerAImp(e.target.value);
            setError(null);
          }}
          disabled={loading}
          required
        />

        <Input
          type="number"
          label={`${match.player_b_name || 'Player B'}${match.player_b_funbridge_username ? ` (${match.player_b_funbridge_username})` : ''} (Handicap: ${playerBHandicap})`}
          value={playerBImp}
          onChange={(e) => {
            setPlayerBImp(e.target.value);
            setError(null);
          }}
          disabled={loading}
          required
        />

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
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          {match.result ? 'Update Score' : 'Submit Score'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

