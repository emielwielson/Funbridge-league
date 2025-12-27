'use client';

import { useState, useEffect } from 'react';
import { getAllUsers } from '@/lib/api/users';
import { getAllDivisions } from '@/lib/api/divisions';
import { assignPlayerToDivision, removePlayerFromDivision } from '@/lib/api/divisions';
import { getActiveLeague, getDraftLeague } from '@/lib/api/leagues';
import type { UserWithDivision } from '@/lib/types/user';
import type { Division } from '@/lib/types/division';
import type { League } from '@/lib/types/league';

interface PlayerAssignmentProps {
  onAssignmentChange?: () => void;
}

export default function PlayerAssignment({ onAssignmentChange }: PlayerAssignmentProps) {
  const [users, setUsers] = useState<UserWithDivision[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch active or draft league
      const [activeResult, draftResult] = await Promise.all([
        getActiveLeague(),
        getDraftLeague(),
      ]);
      
      const league = activeResult.data || draftResult.data;
      if (league) {
        setCurrentLeague(league);
      }

      // Fetch users and divisions
      const [usersResult, divisionsResult] = await Promise.all([
        getAllUsers(),
        getAllDivisions(),
      ]);

      if (usersResult.error) {
        setError(usersResult.error);
        setLoading(false);
        return;
      }

      if (divisionsResult.error) {
        setError(divisionsResult.error);
        setLoading(false);
        return;
      }

      setUsers(usersResult.data || []);
      setDivisions(divisionsResult.data || []);
      
      if (divisionsResult.data && divisionsResult.data.length > 0) {
        setSelectedDivision(divisionsResult.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (playerId: string, divisionId: string) => {
    if (!currentLeague) {
      setError('No league found. Please create a league first.');
      return;
    }

    setAssigning(playerId);
    setError(null);

    const { error: assignError } = await assignPlayerToDivision(
      playerId,
      divisionId,
      currentLeague.id
    );

    if (assignError) {
      setError(assignError);
      setAssigning(null);
      return;
    }

    // Refresh data
    await fetchData();
    setAssigning(null);
    if (onAssignmentChange) {
      onAssignmentChange();
    }
  };

  const handleRemove = async (playerId: string) => {
    if (!currentLeague) {
      setError('No league found.');
      return;
    }

    setAssigning(playerId);
    setError(null);

    const { error: removeError } = await removePlayerFromDivision(
      playerId,
      currentLeague.id
    );

    if (removeError) {
      setError(removeError);
      setAssigning(null);
      return;
    }

    // Refresh data
    await fetchData();
    setAssigning(null);
    if (onAssignmentChange) {
      onAssignmentChange();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const canAssign = currentLeague?.status === 'draft';

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!currentLeague ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No league found. Create a league to assign players to divisions.
        </div>
      ) : !canAssign ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          League is {currentLeague.status}. Players can only be assigned when the league is in draft status.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Players to Divisions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a division and assign players. Each player can only be in one division per league.
            </p>

            <div className="mb-4">
              <label htmlFor="division-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Division
              </label>
              <select
                id="division-select"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a division</option>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Players</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">
                      {user.division_name
                        ? `Currently in: ${user.division_name}`
                        : 'Not assigned to any division'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.division_id ? (
                      <button
                        onClick={() => handleRemove(user.id)}
                        disabled={assigning === user.id}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {assigning === user.id ? 'Removing...' : 'Remove'}
                      </button>
                    ) : null}
                    {selectedDivision && (
                      <button
                        onClick={() => handleAssign(user.id, selectedDivision)}
                        disabled={assigning === user.id || !canAssign}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {assigning === user.id
                          ? 'Assigning...'
                          : user.division_id
                          ? 'Reassign'
                          : 'Assign'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

