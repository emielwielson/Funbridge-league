'use client';

import type { MatchWithResult } from '@/lib/types/match';
import {
  calculateMatchOutcome,
  calculateMatchPoints,
  calculateFinalScore,
} from '@/lib/utils/match-calculations';

interface MatchResultDisplayProps {
  match: MatchWithResult;
  playerAHandicap: number;
  playerBHandicap: number;
}

export default function MatchResultDisplay({
  match,
  playerAHandicap,
  playerBHandicap,
}: MatchResultDisplayProps) {
  if (!match.result) {
    return <span className="text-gray-400">No result</span>;
  }

  const playerAFinalScore = calculateFinalScore(
    match.result.player_a_imp_score,
    playerAHandicap
  );
  const playerBFinalScore = calculateFinalScore(
    match.result.player_b_imp_score,
    playerBHandicap
  );

  const outcome = calculateMatchOutcome(
    match.result.player_a_imp_score,
    playerAHandicap,
    match.result.player_b_imp_score,
    playerBHandicap
  );

  const playerAPoints = calculateMatchPoints(outcome, 'a');
  const playerBPoints = calculateMatchPoints(outcome, 'b');

  const getOutcomeText = (): string => {
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

  const playerAWins = outcome === 'player_a_wins';
  const playerBWins = outcome === 'player_b_wins';
  const isTie = outcome === 'tie';

  return (
    <div className="space-y-2 text-sm">
      <div className="space-y-1">
        <div
          className={`flex justify-between items-center p-2 rounded ${
            playerAWins ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}
        >
          <span className="font-medium text-gray-900">
            {match.player_a_name || 'Player A'}
            {match.player_a_funbridge_username && (
              <span className="text-gray-500 font-normal"> ({match.player_a_funbridge_username})</span>
            )}
          </span>
          <span className="text-gray-700">
            {match.result.player_a_imp_score} + {playerAHandicap} ={' '}
            <strong>{playerAFinalScore}</strong>
          </span>
          <span className="text-gray-600">({playerAPoints} pts)</span>
        </div>
        <div
          className={`flex justify-between items-center p-2 rounded ${
            playerBWins ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}
        >
          <span className="font-medium text-gray-900">
            {match.player_b_name || 'Player B'}
            {match.player_b_funbridge_username && (
              <span className="text-gray-500 font-normal"> ({match.player_b_funbridge_username})</span>
            )}
          </span>
          <span className="text-gray-700">
            {match.result.player_b_imp_score} + {playerBHandicap} ={' '}
            <strong>{playerBFinalScore}</strong>
          </span>
          <span className="text-gray-600">({playerBPoints} pts)</span>
        </div>
      </div>
      <div className="text-center pt-1">
        <span
          className={`text-sm font-medium ${
            isTie ? 'text-gray-600' : playerAWins || playerBWins ? 'text-green-600' : 'text-gray-600'
          }`}
        >
          {getOutcomeText()}
        </span>
      </div>
    </div>
  );
}

