'use client';

import { useState, FormEvent } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { changePassword } from '@/lib/auth/auth-helpers';
import { validatePassword, validatePasswordMatch } from '@/lib/utils/validation';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccess(false);

    const errs: Record<string, string> = {};
    const currentTrimmed = currentPassword.trim();
    const newTrimmed = newPassword.trim();
    const confirmTrimmed = confirmPassword.trim();

    if (!currentTrimmed) errs.currentPassword = 'Current password is required';
    const pwdResult = validatePassword(newTrimmed);
    if (!pwdResult.isValid && pwdResult.error) errs.newPassword = pwdResult.error;
    else if (newTrimmed.length < 6) errs.newPassword = 'New password must be at least 6 characters';
    const matchResult = validatePasswordMatch(newTrimmed, confirmTrimmed);
    if (!matchResult.isValid && matchResult.error) errs.confirmPassword = matchResult.error;

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    setLoading(true);
    const { error } = await changePassword(currentTrimmed, newTrimmed);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Failed to change password');
      return;
    }
    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Change password</h1>
          <p className="text-sm text-gray-600 mb-6">
            Enter your current password and choose a new one.
          </p>

          {errorMessage && (
            <Alert variant="error" className="mb-4" dismissible onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mb-4">
              Your password has been updated.
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              label="Current password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (errors.currentPassword) setErrors((p) => ({ ...p, currentPassword: '' }));
              }}
              placeholder="Enter your current password"
              error={errors.currentPassword}
              required
              disabled={loading}
              autoComplete="current-password"
            />
            <Input
              type="password"
              label="New password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: '' }));
              }}
              placeholder="At least 6 characters"
              error={errors.newPassword}
              helperText="Minimum 6 characters (8+ recommended)"
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <Input
              type="password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }));
              }}
              placeholder="Re-enter new password"
              error={errors.confirmPassword}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
              Change password
            </Button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
