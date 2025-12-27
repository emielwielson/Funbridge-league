/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate username
 * Requirements:
 * - 3-20 characters
 * - Alphanumeric and underscores only
 * - Must start with a letter
 */
export function validateUsername(username: string): ValidationResult {
  if (!username || username.trim() === '') {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }

  // Must start with a letter
  if (!/^[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Username must start with a letter' };
  }

  // Alphanumeric and underscores only
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    };
  }

  return { isValid: true };
}

/**
 * Validate password strength
 * Requirements:
 * - At least 6 characters (Supabase minimum)
 * - Recommended: 8+ characters for better security
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }

  // Optional: Check for password strength
  if (password.length < 8) {
    return {
      isValid: true,
      error: 'Consider using a longer password (8+ characters) for better security',
    };
  }

  return { isValid: true };
}

/**
 * Validate that passwords match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword || confirmPassword === '') {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
}

/**
 * Validate all registration fields
 */
export interface RegistrationData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface RegistrationValidationResult {
  isValid: boolean;
  errors: {
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
  };
}

export function validateRegistration(
  data: RegistrationData
): RegistrationValidationResult {
  const errors: RegistrationValidationResult['errors'] = {};
  let isValid = true;

  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error;
    isValid = false;
  }

  const usernameResult = validateUsername(data.username);
  if (!usernameResult.isValid) {
    errors.username = usernameResult.error;
    isValid = false;
  }

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.error;
    isValid = false;
  } else if (passwordResult.error) {
    // Warning about password strength (not blocking)
    errors.password = passwordResult.error;
  }

  const matchResult = validatePasswordMatch(data.password, data.confirmPassword);
  if (!matchResult.isValid) {
    errors.confirmPassword = matchResult.error;
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * Validate login fields
 */
export interface LoginData {
  username: string;
  password: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: {
    username?: string;
    password?: string;
  };
}

export function validateLogin(data: LoginData): LoginValidationResult {
  const errors: LoginValidationResult['errors'] = {};
  let isValid = true;

  // Validate username (required for login)
  if (!data.username || data.username.trim() === '') {
    errors.username = 'Username is required';
    isValid = false;
  }

  if (!data.password || data.password === '') {
    errors.password = 'Password is required';
    isValid = false;
  }

  return { isValid, errors };
}

