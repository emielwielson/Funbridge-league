'use client';

import LeagueControls from '@/components/admin/LeagueControls';

export default function AdminLeaguePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">League Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create, start, and finish leagues. Once a league is started, divisions and player assignments cannot be changed.
        </p>
      </div>
      <LeagueControls />
    </div>
  );
}

