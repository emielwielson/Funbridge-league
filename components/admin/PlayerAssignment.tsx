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
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [updatingPlayers, setUpdatingPlayers] = useState<Set<string>>(new Set());

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
      
      // Expand all divisions by default
      const allDivisionIds = new Set(divisionsResult.data?.map(d => d.id) || []);
      allDivisionIds.add('no-division'); // Also expand "No Division"
      setExpandedDivisions(allDivisionIds);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleDivision = (divisionId: string) => {
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) {
        newSet.delete(divisionId);
      } else {
        newSet.add(divisionId);
      }
      return newSet;
    });
  };

  const handleDivisionChange = async (playerId: string, newDivisionId: string | null) => {
    if (!currentLeague) {
      setError('No league found. Please create a league first.');
      return;
    }

    // Find the player being moved
    const player = users.find(u => u.id === playerId);
    if (!player) return;

    const oldDivisionId = player.division_id || null;
    
    // Optimistically update the UI immediately
    setUsers(prevUsers => {
      return prevUsers.map(u => {
        if (u.id === playerId) {
          return {
            ...u,
            division_id: newDivisionId || undefined,
            division_name: newDivisionId 
              ? divisions.find(d => d.id === newDivisionId)?.name 
              : undefined,
          };
        }
        return u;
      });
    });

    setUpdatingPlayers(prev => new Set(prev).add(playerId));
    setError(null);

    try {
      if (newDivisionId === null || newDivisionId === 'no-division') {
        // Remove from division
        const { error: removeError } = await removePlayerFromDivision(
          playerId,
          currentLeague.id
        );

        if (removeError) {
          // Revert optimistic update on error
          setUsers(prevUsers => {
            return prevUsers.map(u => {
              if (u.id === playerId) {
                return {
                  ...u,
                  division_id: oldDivisionId || undefined,
                  division_name: oldDivisionId 
                    ? divisions.find(d => d.id === oldDivisionId)?.name 
                    : undefined,
                };
              }
              return u;
            });
          });
          setError(removeError);
          return;
        }
      } else {
        // Assign to division
        const { error: assignError } = await assignPlayerToDivision(
          playerId,
          newDivisionId,
          currentLeague.id
        );

        if (assignError) {
          // Revert optimistic update on error
          setUsers(prevUsers => {
            return prevUsers.map(u => {
              if (u.id === playerId) {
                return {
                  ...u,
                  division_id: oldDivisionId || undefined,
                  division_name: oldDivisionId 
                    ? divisions.find(d => d.id === oldDivisionId)?.name 
                    : undefined,
                };
              }
              return u;
            });
          });
          setError(assignError);
          return;
        }
      }

      // Success - notify parent if callback provided
      if (onAssignmentChange) {
        onAssignmentChange();
      }
    } catch (err: any) {
      // Revert optimistic update on error
      setUsers(prevUsers => {
        return prevUsers.map(u => {
          if (u.id === playerId) {
            return {
              ...u,
              division_id: oldDivisionId || undefined,
              division_name: oldDivisionId 
                ? divisions.find(d => d.id === oldDivisionId)?.name 
                : undefined,
            };
          }
          return u;
        });
      });
      setError(err.message || 'Failed to update player assignment');
    } finally {
      setUpdatingPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
  };

  // Group users by division
  const usersByDivision = new Map<string, UserWithDivision[]>();
  const noDivisionUsers: UserWithDivision[] = [];

  users.forEach(user => {
    if (user.division_id) {
      if (!usersByDivision.has(user.division_id)) {
        usersByDivision.set(user.division_id, []);
      }
      usersByDivision.get(user.division_id)!.push(user);
    } else {
      noDivisionUsers.push(user);
    }
  });

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
        <div className="space-y-2">
          {/* Divisions List */}
          {divisions.map((division) => {
            const divisionUsers = usersByDivision.get(division.id) || [];
            const isExpanded = expandedDivisions.has(division.id);

            return (
              <div key={division.id} className="bg-white rounded-lg shadow border border-gray-200">
                <button
                  onClick={() => toggleDivision(division.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  disabled={!canAssign}
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-lg font-medium text-gray-900">{division.name}</span>
                    <span className="text-sm text-gray-500">
                      ({divisionUsers.length} {divisionUsers.length === 1 ? 'player' : 'players'})
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    {divisionUsers.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No players in this division</p>
                    ) : (
                      <div className="space-y-3">
                        {divisionUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                          >
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                            <select
                              value={user.division_id || 'no-division'}
                              onChange={(e) => {
                                const newDivisionId = e.target.value === 'no-division' ? null : e.target.value;
                                handleDivisionChange(user.id, newDivisionId);
                              }}
                              disabled={updatingPlayers.has(user.id) || !canAssign}
                              className="ml-4 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="no-division">No Division</option>
                              {divisions.map((div) => (
                                <option key={div.id} value={div.id}>
                                  {div.name}
                                </option>
                              ))}
                            </select>
                            {updatingPlayers.has(user.id) && (
                              <span className="ml-2 text-xs text-gray-500">Updating...</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* No Division Section */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <button
              onClick={() => toggleDivision('no-division')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              disabled={!canAssign}
            >
              <div className="flex items-center space-x-3">
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedDivisions.has('no-division') ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-lg font-medium text-gray-900">No Division</span>
                <span className="text-sm text-gray-500">
                  ({noDivisionUsers.length} {noDivisionUsers.length === 1 ? 'player' : 'players'})
                </span>
              </div>
            </button>

            {expandedDivisions.has('no-division') && (
              <div className="border-t border-gray-200 px-6 py-4">
                {noDivisionUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">All players are assigned to divisions</p>
                ) : (
                  <div className="space-y-3">
                    {noDivisionUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                        <select
                          value="no-division"
                          onChange={(e) => {
                            const newDivisionId = e.target.value === 'no-division' ? null : e.target.value;
                            handleDivisionChange(user.id, newDivisionId);
                          }}
                          disabled={updatingPlayers.has(user.id) || !canAssign}
                          className="ml-4 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="no-division">No Division</option>
                          {divisions.map((div) => (
                            <option key={div.id} value={div.id}>
                              {div.name}
                            </option>
                          ))}
                        </select>
                        {updatingPlayers.has(user.id) && (
                          <span className="ml-2 text-xs text-gray-500">Updating...</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
