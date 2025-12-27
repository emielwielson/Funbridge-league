'use client';

import { useState } from 'react';
import { updateHandicap } from '@/lib/api/users';
import type { User } from '@/lib/types/user';

interface HandicapEditorProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function HandicapEditor({ user, onUpdate }: HandicapEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [handicap, setHandicap] = useState(user.handicap.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const handicapNum = parseInt(handicap, 10);
    
    if (isNaN(handicapNum)) {
      setError('Handicap must be a number');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: updateError } = await updateHandicap(user.id, handicapNum);

    if (updateError || !data) {
      setError(updateError || 'Failed to update handicap');
      setLoading(false);
      return;
    }

    onUpdate(data);
    setIsEditing(false);
    setLoading(false);
  };

  const handleCancel = () => {
    setHandicap(user.handicap.toString());
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={handicap}
          onChange={(e) => {
            setHandicap(e.target.value);
            setError(null);
          }}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900 bg-white"
          disabled={loading}
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Save'}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-900">{user.handicap}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
      >
        Edit
      </button>
    </div>
  );
}

