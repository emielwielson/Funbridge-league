'use client';

import { useState, FormEvent } from 'react';
import { validateLogin, validateRegistration } from '@/lib/utils/validation';
import type { LoginData, RegistrationData } from '@/lib/utils/validation';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: LoginData | RegistrationData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function AuthForm({ mode, onSubmit, loading = false, error }: AuthFormProps) {
  // Use separate state for each field to avoid type issues
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState(''); // For login mode
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errors.username) {
      setErrors((prev) => ({ ...prev, username: '' }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (mode === 'register') {
      const formData: RegistrationData = { email, password, username, confirmPassword };
      const validation = validateRegistration(formData);
      if (validation.errors[field as keyof typeof validation.errors]) {
        setErrors((prev) => ({
          ...prev,
          [field]: validation.errors[field as keyof typeof validation.errors],
        }));
      }
    } else {
      const formData: LoginData = { username: loginUsername, password };
      const validation = validateLogin(formData);
      if (validation.errors[field as keyof typeof validation.errors]) {
        setErrors((prev) => ({
          ...prev,
          [field]: validation.errors[field as keyof typeof validation.errors],
        }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    let validation;
    if (mode === 'register') {
      const formData: RegistrationData = { email, password, username, confirmPassword };
      validation = validateRegistration(formData);
    } else {
      const formData: LoginData = { username: loginUsername, password };
      validation = validateLogin(formData);
    }

    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      // Mark all fields as touched
      const allFields = mode === 'register' 
        ? ['email', 'username', 'password', 'confirmPassword']
        : ['username', 'password'];
      setTouched(
        allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      );
      return;
    }

    // Clear errors and submit
    setErrors({});
    if (mode === 'register') {
      await onSubmit({ email, password, username, confirmPassword });
    } else {
      await onSubmit({ username: loginUsername, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {mode === 'register' ? (
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-900">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            placeholder="your.email@example.com"
            className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              touched.email && errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={loading}
          />
          {!touched.email && (
            <p className="mt-1 text-xs text-gray-500">Enter a valid email address</p>
          )}
          {touched.email && errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 text-gray-900">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={loginUsername}
            onChange={(e) => {
              setLoginUsername(e.target.value);
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: '' }));
              }
            }}
            onBlur={() => handleBlur('username')}
            placeholder="Enter your username"
            className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              touched.username && errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={loading}
          />
          {!touched.username && (
            <p className="mt-1 text-xs text-gray-500">Enter your username</p>
          )}
          {touched.username && errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>
      )}

      {mode === 'register' && (
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1 text-gray-900">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleUsernameChange}
            onBlur={() => handleBlur('username')}
            placeholder="username"
            className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              touched.username && errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={loading}
          />
          {!touched.username && (
            <p className="mt-1 text-xs text-gray-500">
              3-20 characters, letters, numbers, and underscores only. Must start with a letter.
            </p>
          )}
          {touched.username && errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-900">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={handlePasswordChange}
          onBlur={() => handleBlur('password')}
          placeholder="Enter your password"
          className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            touched.password && errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          required
          disabled={loading}
        />
        {!touched.password && (
          <p className="mt-1 text-xs text-gray-500">
            Minimum 6 characters (8+ recommended for better security)
          </p>
        )}
        {touched.password && errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {mode === 'register' && (
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-gray-900">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder="Re-enter your password"
            className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              touched.confirmPassword && errors.confirmPassword
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            required
            disabled={loading}
          />
          {!touched.confirmPassword && (
            <p className="mt-1 text-xs text-gray-500">Must match your password</p>
          )}
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Register'}
      </button>
    </form>
  );
}
