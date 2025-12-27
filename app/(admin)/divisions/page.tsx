'use client';

import DivisionManager from '@/components/admin/DivisionManager';
import PlayerAssignment from '@/components/admin/PlayerAssignment';

export default function AdminDivisionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Division Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create divisions and assign players to them. Players can only be assigned when the league is in draft status.
        </p>
      </div>

      <DivisionManager />

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Player Assignment</h3>
        <PlayerAssignment />
      </div>
    </div>
  );
}

