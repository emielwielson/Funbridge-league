'use client';

import type { UserRole } from '@/lib/types/user';

interface UserRoleBadgeProps {
  role: UserRole;
}

export default function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const isAdmin = role === 'admin';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAdmin
          ? 'bg-purple-100 text-purple-800'
          : 'bg-blue-100 text-blue-800'
      }`}
    >
      {isAdmin ? 'Admin' : 'Player'}
    </span>
  );
}

