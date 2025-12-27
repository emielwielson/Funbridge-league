'use client';

import OldLeaguesList from '@/components/admin/OldLeaguesList';

export default function AdminOldLeaguesPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Old Leagues</h2>
        <p className="mt-1 text-sm text-gray-600">
          View archived leagues. These leagues are read-only and cannot be modified.
        </p>
      </div>
      <OldLeaguesList />
    </div>
  );
}

