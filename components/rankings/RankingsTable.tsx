'use client';

import type { PlayerRanking } from '@/lib/types/rankings';

interface RankingsTableProps {
  rankings: PlayerRanking[];
  loading?: boolean;
}

export default function RankingsTable({ rankings, loading }: RankingsTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading rankings...</div>
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        No matches played yet. Rankings will appear here once match results are entered.
      </div>
    );
  }

  const formatScoreDifference = (difference: number): string => {
    if (difference > 0) {
      return `+${difference}`;
    } else if (difference < 0) {
      return `${difference}`;
    }
    return '0';
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Handicap
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Matches
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wins
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ties
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score Diff
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankings.map((ranking) => (
              <tr key={ranking.playerId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ranking.rank}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ranking.playerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ranking.handicap}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ranking.matchesPlayed}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ranking.wins}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {ranking.ties}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ranking.matchPoints}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatScoreDifference(ranking.finalScoreDifference)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {rankings.map((ranking) => (
          <div
            key={ranking.playerId}
            className="bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  #{ranking.rank}
                </span>
                <span className="text-lg font-medium text-gray-900">
                  {ranking.playerName}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {ranking.matchPoints} pts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Handicap:</span>{' '}
                <span className="text-gray-900">{ranking.handicap}</span>
              </div>
              <div>
                <span className="text-gray-500">Matches:</span>{' '}
                <span className="text-gray-900">{ranking.matchesPlayed}</span>
              </div>
              <div>
                <span className="text-gray-500">Wins:</span>{' '}
                <span className="text-gray-900">{ranking.wins}</span>
              </div>
              <div>
                <span className="text-gray-500">Ties:</span>{' '}
                <span className="text-gray-900">{ranking.ties}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Score Difference:</span>{' '}
                <span className="text-gray-900">
                  {formatScoreDifference(ranking.finalScoreDifference)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

