'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, promoteToAdmin } from '@/lib/api/users';
import type { UserWithDivision } from '@/lib/types/user';
import UserRoleBadge from './UserRoleBadge';
import HandicapEditor from './HandicapEditor';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

interface UserListProps {
  onUserUpdate?: () => void;
}

export default function UserList({ onUserUpdate }: UserListProps) {
  const [users, setUsers] = useState<UserWithDivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getAllUsers();

    if (fetchError || !data) {
      setError(fetchError || 'Failed to load users');
      setLoading(false);
      return;
    }

    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePromote = async (userId: string) => {
    if (!confirm('Are you sure you want to promote this user to admin?')) {
      return;
    }

    setPromotingUserId(userId);
    const { data, error: promoteError } = await promoteToAdmin(userId);

    if (promoteError || !data) {
      alert(promoteError || 'Failed to promote user');
      setPromotingUserId(null);
      return;
    }

    // Update user in list
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, role: 'admin' } : user))
    );
    setPromotingUserId(null);
    if (onUserUpdate) {
      onUserUpdate();
    }
  };

  const handleHandicapUpdate = (updatedUser: UserWithDivision) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Desktop Skeleton */}
        <div className="hidden md:block">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <th key={i} className="px-6 py-3">
                      <Skeleton height={20} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} className="px-6 py-4">
                        <Skeleton height={16} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <Skeleton height={24} className="mb-3" />
              <div className="space-y-2">
                <Skeleton height={16} />
                <Skeleton height={16} />
                <Skeleton height={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" dismissible>
        {error}
      </Alert>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table View */}
      <table className="min-w-full divide-y divide-gray-200 hidden md:table">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Funbridge Username
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Handicap
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Division
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.funbridge_username || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <UserRoleBadge role={user.role} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <HandicapEditor user={user} onUpdate={handleHandicapUpdate} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.division_name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {user.role !== 'admin' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePromote(user.id)}
                    loading={promotingUserId === user.id}
                    disabled={promotingUserId === user.id}
                  >
                    Promote to Admin
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">
                  Funbridge: {user.funbridge_username || 'Not set'}
                </p>
              </div>
              <UserRoleBadge role={user.role} />
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Handicap:</span>
                <HandicapEditor user={user} onUpdate={handleHandicapUpdate} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Division:</span>
                <span className="text-sm text-gray-900">
                  {user.division_name || 'Not assigned'}
                </span>
              </div>
              {user.role !== 'admin' && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handlePromote(user.id)}
                    loading={promotingUserId === user.id}
                    disabled={promotingUserId === user.id}
                  >
                    Promote to Admin
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

