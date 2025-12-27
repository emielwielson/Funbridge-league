'use client';

import { useState } from 'react';
import type { MatchWithResult } from '@/lib/types/match';
import ScoreEntryForm from './ScoreEntryForm';
import MatchResultDisplay from './MatchResultDisplay';

interface MatchListProps {
  matches: MatchWithResult[];
  currentUserId: string;
  currentUserRole?: 'player' | 'admin';
  onResultSubmit?: () => void;
}

export default function MatchList({
  matches,
  currentUserId,
  currentUserRole = 'player',
  onResultSubmit,
}: MatchListProps) {
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  // Get handicaps from match data (already included from API)
  const getPlayerAHandicap = (match: MatchWithResult): number => {
    return match.player_a_handicap ?? 0;
  };

  const getPlayerBHandicap = (match: MatchWithResult): number => {
    return match.player_b_handicap ?? 0;
  };

  const isUserInMatch = (match: MatchWithResult): boolean => {
    return match.player_a_id === currentUserId || match.player_b_id === currentUserId;
  };

  const getMatchStatus = (match: MatchWithResult): string => {
    if (match.result) {
      return 'Completed';
    }
    return 'Not Started';
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        No matches found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player A
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player B
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map((match) => {
              const playerAHandicap = getPlayerAHandicap(match);
              const playerBHandicap = getPlayerBHandicap(match);
              const canEdit = isUserInMatch(match) || currentUserRole === 'admin';
              const isEditing = editingMatchId === match.id;

              return (
                <tr key={match.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-gray-900">
                      {match.player_a_name || 'Unknown'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Handicap: {playerAHandicap}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-gray-900">
                      {match.player_b_name || 'Unknown'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Handicap: {playerBHandicap}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getMatchStatus(match)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {match.result ? (
                      <MatchResultDisplay
                        match={match}
                        playerAHandicap={playerAHandicap}
                        playerBHandicap={playerBHandicap}
                      />
                    ) : (
                      <span className="text-gray-400">No result</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isEditing ? (
                      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 min-w-[300px]">
                        <ScoreEntryForm
                          match={match}
                          currentUserId={currentUserId}
                          playerAHandicap={playerAHandicap}
                          playerBHandicap={playerBHandicap}
                          onSubmit={async (playerAImp, playerBImp) => {
                            // Refresh matches after submission
                            if (onResultSubmit) {
                              await onResultSubmit();
                            }
                            // Close the form
                            setEditingMatchId(null);
                          }}
                          onCancel={() => setEditingMatchId(null)}
                        />
                      </div>
                    ) : (
                      canEdit && (
                        <button
                          onClick={() => setEditingMatchId(match.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {match.result ? 'Edit Score' : 'Enter Score'}
                        </button>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {matches.map((match) => {
          const playerAHandicap = getPlayerAHandicap(match);
          const playerBHandicap = getPlayerBHandicap(match);
          const canEdit = isUserInMatch(match) || currentUserRole === 'admin';
          const isEditing = editingMatchId === match.id;

          return (
            <div
              key={match.id}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {match.player_a_name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Handicap: {playerAHandicap}
                  </div>
                </div>
                <div className="text-center text-gray-400">vs</div>
                <div>
                  <div className="font-medium text-gray-900">
                    {match.player_b_name || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Handicap: {playerBHandicap}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">
                    Status: {getMatchStatus(match)}
                  </div>
                  {match.result && (
                    <MatchResultDisplay
                      match={match}
                      playerAHandicap={playerAHandicap}
                      playerBHandicap={playerBHandicap}
                    />
                  )}
                </div>
                {isEditing ? (
                  <ScoreEntryForm
                    match={match}
                    currentUserId={currentUserId}
                    playerAHandicap={playerAHandicap}
                    playerBHandicap={playerBHandicap}
                    onSubmit={async (playerAImp, playerBImp) => {
                      // Refresh matches after submission
                      if (onResultSubmit) {
                        await onResultSubmit();
                      }
                      // Close the form
                      setEditingMatchId(null);
                    }}
                    onCancel={() => setEditingMatchId(null)}
                  />
                ) : (
                  canEdit && (
                    <button
                      onClick={() => setEditingMatchId(match.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      {match.result ? 'Edit Score' : 'Enter Score'}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

