/**
 * Permission System for Role-Based Access Control
 * 
 * This module defines which roles have access to which features in the application.
 */

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OFFICE_ADMIN' 
  | 'PROJECT_MANAGER' 
  | 'FIELD_SUPERVISOR' 
  | 'FIELD_WORKER' 
  | 'CLIENT_READ_ONLY';

export type Feature = 
  | 'dashboard'
  | 'projects'
  | 'files'
  | 'clients'
  | 'documents'
  | 'photos'
  | 'daily-logs'
  | 'quotes'
  | 'employees'
  | 'timekeeping'
  | 'users'
  | 'settings';

/**
 * Feature permissions mapping
 * Defines which roles can access which features
 */
const FEATURE_PERMISSIONS: Record<Feature, UserRole[]> = {
  dashboard: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'],
  projects: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
  files: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
  clients: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER'],
  documents: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
  photos: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY'],
  'daily-logs': ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY'],
  quotes: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
  employees: ['SUPER_ADMIN', 'OFFICE_ADMIN'],
  timekeeping: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR'],
  users: ['SUPER_ADMIN'],
  settings: ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PROJECT_MANAGER', 'FIELD_SUPERVISOR', 'FIELD_WORKER', 'CLIENT_READ_ONLY'],
};

/**
 * Check if a user role has access to a specific feature
 * @param userRole - The user's role
 * @param feature - The feature to check access for
 * @returns true if the user has access, false otherwise
 */
export const hasFeatureAccess = (userRole: string | undefined, feature: Feature): boolean => {
  if (!userRole) return false;
  return FEATURE_PERMISSIONS[feature]?.includes(userRole as UserRole) ?? false;
};

