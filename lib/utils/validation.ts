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
 * Validate name (firstname & lastname)
 * Requirements:
 * - At least 2 characters
 * - Can contain letters, spaces, hyphens, and apostrophes
 */
export function validateName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Name must be 100 characters or less' };
  }

  // Allow letters, spaces, hyphens, and apostrophes (for names like "O'Brien" or "Mary-Jane")
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Name can only contain letters, spaces, hyphens, and apostrophes',
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
  name: string;
  funbridge_username: string | undefined;
  password: string;
  confirmPassword: string;
}

export interface RegistrationValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    funbridge_username?: string;
    password?: string;
    confirmPassword?: string;
  };
}

/**
 * Validate Funbridge username
 * More lenient than regular username - can be any non-empty string
 */
export function validateFunbridgeUsername(funbridge_username: string | undefined): ValidationResult {
  if (!funbridge_username || typeof funbridge_username !== 'string') {
    return { isValid: false, error: 'Funbridge username is required' };
  }

  const trimmed = funbridge_username.trim();

  if (trimmed.length < 1) {
    return { isValid: false, error: 'Funbridge username cannot be empty' };
  }

  return { isValid: true };
}

export function validateRegistration(
  data: RegistrationData
): RegistrationValidationResult {
  const errors: RegistrationValidationResult['errors'] = {};
  let isValid = true;

  const nameResult = validateName(data.name);
  if (!nameResult.isValid) {
    errors.name = nameResult.error;
    isValid = false;
  }

  const funbridgeUsernameResult = validateFunbridgeUsername(data.funbridge_username);
  if (!funbridgeUsernameResult.isValid) {
    errors.funbridge_username = funbridgeUsernameResult.error;
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
  name: string;
  password: string;
}

export interface LoginValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    password?: string;
  };
}

export function validateLogin(data: LoginData): LoginValidationResult {
  const errors: LoginValidationResult['errors'] = {};
  let isValid = true;

  // Validate name (required for login)
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
    isValid = false;
  }

  if (!data.password || data.password === '') {
    errors.password = 'Password is required';
    isValid = false;
  }

  return { isValid, errors };
}

