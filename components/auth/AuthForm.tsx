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
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loginName, setLoginName] = useState(''); // For login mode
  const [funbridgeUsername, setFunbridgeUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleFunbridgeUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFunbridgeUsername(e.target.value);
    if (errors.funbridge_username) {
      setErrors((prev) => ({ ...prev, funbridge_username: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Validate on blur
    if (mode === 'register') {
      const formData: RegistrationData = { password, name, funbridge_username: funbridgeUsername, confirmPassword };
      const validation = validateRegistration(formData);
      if (validation.errors[field as keyof typeof validation.errors]) {
        setErrors((prev) => ({
          ...prev,
          [field]: validation.errors[field as keyof typeof validation.errors],
        }));
      }
    } else {
      const formData: LoginData = { name: loginName, password };
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
      const formData: RegistrationData = { password, name, funbridge_username: funbridgeUsername, confirmPassword };
      validation = validateRegistration(formData);
    } else {
      const formData: LoginData = { name: loginName, password };
      validation = validateLogin(formData);
    }

    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      // Mark all fields as touched
      const allFields = mode === 'register' 
        ? ['name', 'funbridge_username', 'password', 'confirmPassword']
        : ['name', 'password'];
      setTouched(
        allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
      );
      return;
    }

    // Clear errors and submit
    setErrors({});
    if (mode === 'register') {
      await onSubmit({ password, name, funbridge_username: funbridgeUsername, confirmPassword });
    } else {
      await onSubmit({ name: loginName, password });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {mode === 'login' ? (
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-900">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={loginName}
            onChange={(e) => {
              setLoginName(e.target.value);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            onBlur={() => handleBlur('name')}
            placeholder="Enter your name"
            className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={loading}
          />
          {!touched.name && (
            <p className="mt-1 text-xs text-gray-500">Enter your full name</p>
          )}
          {touched.name && errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-900">
              Name (First & Last) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleNameChange}
              onBlur={() => handleBlur('name')}
              placeholder="John Doe"
              className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.name && errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={loading}
            />
            {!touched.name && (
              <p className="mt-1 text-xs text-gray-500">
                Enter your first and last name
              </p>
            )}
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="funbridge_username" className="block text-sm font-medium mb-1 text-gray-900">
              Funbridge Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="funbridge_username"
              name="funbridge_username"
              value={funbridgeUsername}
              onChange={handleFunbridgeUsernameChange}
              onBlur={() => handleBlur('funbridge_username')}
              placeholder="Your Funbridge username"
              className={`w-full px-3 py-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                touched.funbridge_username && errors.funbridge_username ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              disabled={loading}
            />
            {!touched.funbridge_username && (
              <p className="mt-1 text-xs text-gray-500">
                Enter your Funbridge username
              </p>
            )}
            {touched.funbridge_username && errors.funbridge_username && (
              <p className="mt-1 text-sm text-red-600">{errors.funbridge_username}</p>
            )}
          </div>
        </>
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
