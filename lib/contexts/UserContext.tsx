'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, onAuthStateChange } from '@/lib/auth/auth-helpers';
import type { UserProfile } from '@/lib/types/user';

interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { user: currentUser, error } = await getCurrentUser();
      if (error) {
        console.error('Error getting user:', error);
        setUser(null);
      } else {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load - set loading to true first
    setLoading(true);
    refreshUser();

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

