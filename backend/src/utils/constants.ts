/**
 * Application Constants
 * 
 * Centralized location for all application constants.
 * Use UPPER_SNAKE_CASE for constant names.
 */

// File upload constants
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// JWT constants
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// API version
export const API_VERSION = 'v1';

// Date formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  FIELD_SUPERVISOR: 'FIELD_SUPERVISOR',
  OFFICE_ADMIN: 'OFFICE_ADMIN',
  FIELD_WORKER: 'FIELD_WORKER',
  CLIENT_READ_ONLY: 'CLIENT_READ_ONLY',
} as const;

// Project statuses
export const PROJECT_STATUSES = {
  QUOTED: 'QUOTED',
  AWARDED: 'AWARDED',
  IN_PROGRESS: 'IN_PROGRESS',
  INSPECTION: 'INSPECTION',
  COMPLETE: 'COMPLETE',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
} as const;

