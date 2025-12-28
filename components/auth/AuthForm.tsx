'use client';

import { useState, FormEvent } from 'react';
import { validateLogin, validateRegistration } from '@/lib/utils/validation';
import type { LoginData, RegistrationData } from '@/lib/utils/validation';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
        setErrors((prev) => {
          const newErrors = { ...prev };
          const errorValue = validation.errors[field as keyof typeof validation.errors];
          if (errorValue) {
            newErrors[field] = errorValue;
          }
          return newErrors;
        });
      }
    } else {
      const formData: LoginData = { name: loginName, password };
      const validation = validateLogin(formData);
      if (validation.errors[field as keyof typeof validation.errors]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          const errorValue = validation.errors[field as keyof typeof validation.errors];
          if (errorValue) {
            newErrors[field] = errorValue;
          }
          return newErrors;
        });
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
        <Alert variant="error" dismissible onDismiss={() => {}}>
          {error}
        </Alert>
      )}

      {mode === 'login' ? (
        <Input
          type="text"
          label="Name"
          value={loginName}
          onChange={(e) => {
            setLoginName(e.target.value);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: '' }));
            }
          }}
          onBlur={() => handleBlur('name')}
          placeholder="Enter your name"
          error={touched.name ? errors.name : undefined}
          helperText={!touched.name ? 'Enter your full name' : undefined}
          required
          disabled={loading}
        />
      ) : (
        <>
          <Input
            type="text"
            label="Name (First & Last)"
            value={name}
            onChange={handleNameChange}
            onBlur={() => handleBlur('name')}
            placeholder="John Doe"
            error={touched.name ? errors.name : undefined}
            helperText={!touched.name ? 'Enter your first and last name' : undefined}
            required
            disabled={loading}
          />

          <Input
            type="text"
            label="Funbridge Username"
            value={funbridgeUsername}
            onChange={handleFunbridgeUsernameChange}
            onBlur={() => handleBlur('funbridge_username')}
            placeholder="Your Funbridge username"
            error={touched.funbridge_username ? errors.funbridge_username : undefined}
            helperText={!touched.funbridge_username ? 'Enter your Funbridge username' : undefined}
            required
            disabled={loading}
          />
        </>
      )}

      <Input
        type="password"
        label="Password"
        value={password}
        onChange={handlePasswordChange}
        onBlur={() => handleBlur('password')}
        placeholder="Enter your password"
        error={touched.password ? errors.password : undefined}
        helperText={!touched.password ? 'Minimum 6 characters (8+ recommended for better security)' : undefined}
        required
        disabled={loading}
      />

      {mode === 'register' && (
        <Input
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder="Re-enter your password"
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
          helperText={!touched.confirmPassword ? 'Must match your password' : undefined}
          required
          disabled={loading}
        />
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={loading}
      >
        {mode === 'login' ? 'Log In' : 'Register'}
      </Button>
    </form>
  );
}
