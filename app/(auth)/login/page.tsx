'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/lib/hooks/useAuth';
import type { LoginData, RegistrationData } from '@/lib/utils/validation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users to home
  useEffect(() => {
    if (!authLoading && user) {
      const redirect = searchParams.get('redirect') || '/';
      router.replace(redirect);
    }
  }, [user, authLoading, router, searchParams]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show login form if user is already authenticated (will redirect)
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Redirecting...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: LoginData | RegistrationData) => {
    // Type guard to ensure we have LoginData
    if ('funbridge_username' in data || 'confirmPassword' in data) {
      setError('Invalid login data');
      return;
    }

    const loginData = data as LoginData;
    setLoading(true);
    setError(null);

    try {
      // Convert LoginData (name) to LoginParams (name)
      const response = await login({
        name: loginData.name,
        password: loginData.password,
      });

      if (response.error) {
        setError(response.error.message);
        return;
      }

      // Redirect to the page they were trying to access, or home
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <AuthForm
          mode="login"
          onSubmit={handleSubmit}
          loading={loading}
          error={error || undefined}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Loading...
            </p>
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

