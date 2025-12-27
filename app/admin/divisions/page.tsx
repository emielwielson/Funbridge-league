'use client';

import { useState } from 'react';
import DivisionManager from '@/components/admin/DivisionManager';
import PlayerAssignment from '@/components/admin/PlayerAssignment';

export default function AdminDivisionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDivisionChange = () => {
    // Force refresh of PlayerAssignment when divisions change
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Division Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create divisions and assign players to them. Players can only be assigned when the league is in draft status.
        </p>
      </div>

      <DivisionManager 
        onDivisionCreated={handleDivisionChange}
        onDivisionDeleted={handleDivisionChange}
        onDivisionUpdated={handleDivisionChange}
      />

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Player Assignment</h3>
        <PlayerAssignment key={refreshKey} onAssignmentChange={handleDivisionChange} />
      </div>
    </div>
  );
}

