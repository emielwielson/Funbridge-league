'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllUsers } from '@/lib/api/users';
import { getAllDivisions } from '@/lib/api/divisions';
import { getActiveLeague, getDraftLeague } from '@/lib/api/leagues';
import type { UserWithDivision } from '@/lib/types/user';
import type { Division } from '@/lib/types/division';
import type { League } from '@/lib/types/league';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<UserWithDivision[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [activeLeague, setActiveLeague] = useState<League | null>(null);
  const [draftLeague, setDraftLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [usersResult, divisionsResult, activeResult, draftResult] =
          await Promise.all([
            getAllUsers(),
            getAllDivisions(),
            getActiveLeague(),
            getDraftLeague(),
          ]);

        if (usersResult.error) {
          setError(usersResult.error);
          setLoading(false);
          return;
        }

        if (divisionsResult.error) {
          setError(divisionsResult.error);
          setLoading(false);
          return;
        }

        setUsers(usersResult.data || []);
        setDivisions(divisionsResult.data || []);
        setActiveLeague(activeResult.data || null);
        setDraftLeague(draftResult.data || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton height={32} className="mb-2" />
          <Skeleton height={16} width="60%" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <Skeleton height={16} className="mb-2" />
              <Skeleton height={32} />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Skeleton height={24} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={44} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" dismissible onDismiss={() => {}}>
        {error}
      </Alert>
    );
  }

  const playersInDivisions = users.filter((u) => u.division_id).length;
  const currentLeague = activeLeague || draftLeague;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your league management system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Players</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Divisions</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {divisions.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Assigned Players</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {playersInDivisions}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">League Status</div>
          <div className="mt-2 text-lg font-bold">
            {activeLeague ? (
              <span className="text-green-600">Active</span>
            ) : draftLeague ? (
              <span className="text-yellow-600">Draft</span>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/users" className="w-full">
            <Button
              variant="primary"
              fullWidth
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            >
              Manage Players
            </Button>
          </Link>
          <Link href="/admin/divisions" className="w-full">
            <Button
              variant="primary"
              fullWidth
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              Manage Divisions
            </Button>
          </Link>
          <Link href="/admin/league" className="w-full">
            <Button
              variant="primary"
              fullWidth
              className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
            >
              League Settings
            </Button>
          </Link>
          <Link href="/admin/old-leagues" className="w-full">
            <Button
              variant="primary"
              fullWidth
              className="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
            >
              View Old Leagues
            </Button>
          </Link>
        </div>
      </div>

      {/* Current League Info */}
      {currentLeague && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Current League
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="text-sm font-medium text-gray-900">
                {currentLeague.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Created:</span>
              <span className="text-sm text-gray-900">
                {new Date(currentLeague.created_at).toLocaleString()}
              </span>
            </div>
            {currentLeague.finished_at && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Finished:</span>
                <span className="text-sm text-gray-900">
                  {new Date(currentLeague.finished_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

