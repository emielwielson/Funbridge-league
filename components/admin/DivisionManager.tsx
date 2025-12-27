'use client';

import { useState, useEffect } from 'react';
import { getAllDivisions, createDivision } from '@/lib/api/divisions';
import type { Division } from '@/lib/types/division';

interface DivisionManagerProps {
  onDivisionCreated?: () => void;
}

export default function DivisionManager({ onDivisionCreated }: DivisionManagerProps) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDivisionName, setNewDivisionName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchDivisions = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getAllDivisions();

    if (fetchError || !data) {
      setError(fetchError || 'Failed to load divisions');
      setLoading(false);
      return;
    }

    setDivisions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDivisions();
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
            {divisions.map((division) => (
              <li key={division.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{division.name}</p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(division.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

