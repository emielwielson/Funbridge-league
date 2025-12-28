'use client';

import { useState } from 'react';
import { updateHandicap } from '@/lib/api/users';
import type { User } from '@/lib/types/user';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
        <Input
          type="number"
          value={handicap}
          onChange={(e) => {
            setHandicap(e.target.value);
            setError(null);
          }}
          className="w-20"
          error={error || undefined}
          disabled={loading}
        />
        <Button
          size="sm"
          variant="primary"
          onClick={handleSave}
          loading={loading}
          disabled={loading}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-900">{user.handicap}</span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setIsEditing(true)}
      >
        Edit
      </Button>
    </div>
  );
}

