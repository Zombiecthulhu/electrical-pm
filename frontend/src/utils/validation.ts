/**
 * Form Validation Utilities
 * 
 * Reusable validation functions with user-friendly error messages.
 * Provides consistent validation across all forms.
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

// Phone validation
export const isValidPhone = (phone: string): boolean => {
  // Matches various formats: (123) 456-7890, 123-456-7890, 1234567890
  const phoneRegex = /^[\d\s()+-]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10;
};

export const validatePhone = (phone: string, required = false): string | null => {
  if (!phone || phone.trim() === '') {
    return required ? 'Phone number is required' : null;
  }
  if (!isValidPhone(phone)) {
    return 'Please enter a valid phone number (at least 10 digits)';
  }
  return null;
};

// Required field validation
export const validateRequired = (
  value: any,
  fieldName: string = 'This field'
): string | null => {
  if (value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }
  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} must have at least one item`;
  }
  return null;
};

// Min/Max length validation
export const validateLength = (
  value: string,
  min?: number,
  max?: number,
  fieldName: string = 'This field'
): string | null => {
  const length = value?.length || 0;

  if (min && length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (max && length > max) {
    return `${fieldName} must be no more than ${max} characters`;
  }
  return null;
};

// Number validation
export const validateNumber = (
  value: any,
  min?: number,
  max?: number,
  fieldName: string = 'This field'
): string | null => {
  const num = Number(value);

  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (min !== undefined && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== undefined && num > max) {
    return `${fieldName} must be no more than ${max}`;
  }
  return null;
};

// Password validation
export const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

// Confirm password validation
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword || confirmPassword.trim() === '') {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateUrl = (url: string, required = false): string | null => {
  if (!url || url.trim() === '') {
    return required ? 'URL is required' : null;
  }
  if (!isValidUrl(url)) {
    return 'Please enter a valid URL (e.g., https://example.com)';
  }
  return null;
};

// Date validation
export const validateDate = (
  date: any,
  fieldName: string = 'Date'
): string | null => {
  if (!date) {
    return `${fieldName} is required`;
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} is not a valid date`;
  }
  return null;
};

// Date range validation
export const validateDateRange = (
  startDate: any,
  endDate: any
): string | null => {
  if (!startDate || !endDate) {
    return null; // Let individual field validation handle required
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null; // Let individual field validation handle invalid dates
  }

  if (start > end) {
    return 'End date must be after start date';
  }

  return null;
};

// File validation
export const validateFile = (
  file: File | null,
  options?: {
    required?: boolean;
    maxSize?: number; // in MB
    allowedTypes?: string[]; // e.g., ['image/jpeg', 'image/png']
  }
): string | null => {
  if (!file) {
    return options?.required ? 'Please select a file' : null;
  }

  if (options?.maxSize) {
    const maxSizeBytes = options.maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size must be less than ${options.maxSize}MB`;
    }
  }

  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      const typeNames = options.allowedTypes.map((type) => {
        const parts = type.split('/');
        return parts[parts.length - 1].toUpperCase();
      });
      return `File must be one of: ${typeNames.join(', ')}`;
    }
  }

  return null;
};

// Multiple files validation
export const validateFiles = (
  files: FileList | File[] | null,
  options?: {
    required?: boolean;
    minFiles?: number;
    maxFiles?: number;
    maxSize?: number; // in MB per file
    allowedTypes?: string[];
  }
): string | null => {
  const fileArray = files ? Array.from(files) : [];

  if (fileArray.length === 0) {
    return options?.required ? 'Please select at least one file' : null;
  }

  if (options?.minFiles && fileArray.length < options.minFiles) {
    return `Please select at least ${options.minFiles} file(s)`;
  }

  if (options?.maxFiles && fileArray.length > options.maxFiles) {
    return `Please select no more than ${options.maxFiles} file(s)`;
  }

  // Validate each file
  for (const file of fileArray) {
    const fileError = validateFile(file, {
      maxSize: options?.maxSize,
      allowedTypes: options?.allowedTypes,
    });
    if (fileError) {
      return fileError;
    }
  }

  return null;
};

// Generic validator that combines multiple validation rules
export const createValidator = (
  rules: ((value: any) => string | null)[]
) => {
  return (value: any): string | null => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
};

// Export all validators
export const validators = {
  email: validateEmail,
  phone: validatePhone,
  required: validateRequired,
  length: validateLength,
  number: validateNumber,
  password: validatePassword,
  confirmPassword: validateConfirmPassword,
  url: validateUrl,
  date: validateDate,
  dateRange: validateDateRange,
  file: validateFile,
  files: validateFiles,
};

export default validators;

