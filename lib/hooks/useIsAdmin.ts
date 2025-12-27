'use client';

import { useUserContext } from '@/lib/contexts/UserContext';

export function useIsAdmin(): boolean {
  const { user } = useUserContext();
  return user?.role === 'admin';
}

