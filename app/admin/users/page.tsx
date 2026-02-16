'use client';

import UserList from '@/components/user/UserList';

export default function AdminUsersPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Player Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and manage all registered players. See who is in the current league, promote players to admin, update handicaps, and remove players from the list.
        </p>
      </div>
      <UserList />
    </div>
  );
}

