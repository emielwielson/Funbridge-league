'use client';

import { useUserContext } from '@/lib/contexts/UserContext';
import type { UserProfile } from '@/lib/types/user';

export function useUser(): UserProfile | null {
  const { user } = useUserContext();
  return user;
}

