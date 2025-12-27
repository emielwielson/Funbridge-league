'use client';

import { useState, useEffect } from 'react';
import { getAllDivisions, createDivision, deleteDivision, updateDivision } from '@/lib/api/divisions';
import { getActiveLeague, getDraftLeague } from '@/lib/api/leagues';
import type { Division } from '@/lib/types/division';
import type { League } from '@/lib/types/league';

interface DivisionManagerProps {
  onDivisionCreated?: () => void;
  onDivisionDeleted?: () => void;
  onDivisionUpdated?: () => void;
}

export default function DivisionManager({ onDivisionCreated, onDivisionDeleted, onDivisionUpdated }: DivisionManagerProps) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDivisionName, setNewDivisionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingDivisionId, setDeletingDivisionId] = useState<string | null>(null);
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null);
  const [editingDivisionName, setEditingDivisionName] = useState<string>('');
  const [updatingDivisionId, setUpdatingDivisionId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch league status
      const [activeResult, draftResult] = await Promise.all([
        getActiveLeague(),
        getDraftLeague(),
      ]);
      
      const league = activeResult.data || draftResult.data;
      if (league) {
        setCurrentLeague(league);
      }

      // Fetch divisions
      const { data, error: fetchError } = await getAllDivisions();

      if (fetchError || !data) {
        setError(fetchError || 'Failed to load divisions');
        setLoading(false);
        return;
      }

      setDivisions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDivisionName.trim()) {
      setError('Division name is required');
      return;
    }

    setCreating(true);
    setError(null);

    const { data, error: createError } = await createDivision(newDivisionName.trim());

    if (createError || !data) {
      setError(createError || 'Failed to create division');
      setCreating(false);
      return;
    }

    setDivisions((prev) => [...prev, data]);
    setNewDivisionName('');
    setCreating(false);
    if (onDivisionCreated) {
      onDivisionCreated();
    }
  };

  const handleDelete = async (divisionId: string, divisionName: string) => {
    // Check if league is active
    if (currentLeague?.status === 'active') {
      setError('Cannot delete division while a league is active. Please finish the active league first.');
      return;
    }

    // Confirm deletion
    const confirmed = confirm(
      `Are you sure you want to delete "${divisionName}"?\n\nAll players in this division will be moved to "No Division".`
    );

    if (!confirmed) {
      return;
    }

    setDeletingDivisionId(divisionId);
    setError(null);

    const { error: deleteError } = await deleteDivision(divisionId);

    if (deleteError) {
      setError(deleteError);
      setDeletingDivisionId(null);
      return;
    }

    // Remove from local state
    setDivisions((prev) => prev.filter((d) => d.id !== divisionId));
    setDeletingDivisionId(null);
    
    if (onDivisionDeleted) {
      onDivisionDeleted();
    }
  };

  const handleStartEdit = (division: Division) => {
    setEditingDivisionId(division.id);
    setEditingDivisionName(division.name);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingDivisionId(null);
    setEditingDivisionName('');
    setError(null);
  };

  const handleSaveEdit = async (divisionId: string) => {
    if (!editingDivisionName.trim()) {
      setError('Division name is required');
      return;
    }

    setUpdatingDivisionId(divisionId);
    setError(null);

    const { data, error: updateError } = await updateDivision(divisionId, editingDivisionName.trim());

    if (updateError || !data) {
      setError(updateError || 'Failed to update division');
      setUpdatingDivisionId(null);
      return;
    }

    // Update local state
    setDivisions((prev) => prev.map((d) => (d.id === divisionId ? data : d)));
    setEditingDivisionId(null);
    setEditingDivisionName('');
    setUpdatingDivisionId(null);
    
    if (onDivisionUpdated) {
      onDivisionUpdated();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading divisions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Division Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Division</h3>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            value={newDivisionName}
            onChange={(e) => {
              setNewDivisionName(e.target.value);
              setError(null);
            }}
            placeholder="Division name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newDivisionName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Divisions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Existing Divisions</h3>
        </div>
        {divisions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No divisions created yet. Create your first division above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {divisions.map((division) => {
              const isEditing = editingDivisionId === division.id;
              const isUpdating = updatingDivisionId === division.id;

              return (
                <li key={division.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingDivisionName}
                            onChange={(e) => {
                              setEditingDivisionName(e.target.value);
                              setError(null);
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isUpdating}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(division.id)}
                            disabled={isUpdating || !editingDivisionName.trim()}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p 
                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                            onClick={() => handleStartEdit(division)}
                            title="Click to edit division name"
                          >
                            {division.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Created {new Date(division.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStartEdit(division)}
                          disabled={currentLeague?.status === 'active'}
                          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            currentLeague?.status === 'active'
                              ? 'Cannot edit division while league is active'
                              : 'Edit division name'
                          }
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(division.id, division.name)}
                          disabled={deletingDivisionId === division.id || currentLeague?.status === 'active'}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            currentLeague?.status === 'active'
                              ? 'Cannot delete division while league is active'
                              : 'Delete division (players will be moved to "No Division")'
                          }
                        >
                          {deletingDivisionId === division.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

