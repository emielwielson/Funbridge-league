'use client';

import { useUserContext } from '@/lib/contexts/UserContext';
import { login, logout, register } from '@/lib/auth/auth-helpers';
import type { LoginParams, RegisterParams } from '@/lib/auth/auth-helpers';
import type { AuthResponse } from '@/lib/auth/auth-helpers';

export function useAuth() {
  const { user, loading, refreshUser } = useUserContext();

  const handleRegister = async (params: RegisterParams): Promise<AuthResponse> => {
    const response = await register(params);
    if (response.user) {
      await refreshUser();
    }
    return response;
  };

  const handleLogin = async (params: LoginParams): Promise<AuthResponse> => {
    const response = await login(params);
    if (response.user) {
      await refreshUser();
    }
    return response;
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (!error) {
      await refreshUser();
    }
    return { error };
  };

  return {
    user,
    loading,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!user,
  };
}

