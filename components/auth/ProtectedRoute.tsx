'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Don't redirect while still loading
    if (loading) {
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      setShouldRedirect(true);
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check admin requirement
    if (requireAdmin && user?.role !== 'admin') {
      setShouldRedirect(true);
      router.replace('/');
      return;
    }

    setShouldRedirect(false);
  }, [loading, isAuthenticated, user, requireAdmin, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render children if we're redirecting
  if (shouldRedirect || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return <>{children}</>;
}

