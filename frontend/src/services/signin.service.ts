import api from './api';
import {
  DailySignIn,
  SignInFormData,
  BulkSignInResult,
  SignInResponse,
  SignInsResponse,
} from '../types/timekeeping.types';

/**
 * Sign-In Service
 * Frontend API client for employee sign-in/sign-out operations
 */

/**
 * Get today's sign-ins
 */
export const getTodaySignIns = async (): Promise<DailySignIn[]> => {
  const response = await api.get('/sign-ins/today') as SignInsResponse;
  return response.data;
};

/**
 * Get sign-ins for a specific date
 */
export const getSignInsForDate = async (
  date: string,
  filters?: { employeeId?: string; projectId?: string }
): Promise<DailySignIn[]> => {
  const params = new URLSearchParams({ date });
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.projectId) params.append('projectId', filters.projectId);

  const response = await api.get(`/sign-ins/date?${params.toString()}`) as SignInsResponse;
  return response.data;
};

/**
 * Get active sign-ins (not signed out yet)
 */
export const getActiveSignIns = async (): Promise<DailySignIn[]> => {
  const response = await api.get('/sign-ins/active') as SignInsResponse;
  return response.data;
};

/**
 * Get employee sign-in history
 */
export const getEmployeeHistory = async (
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<DailySignIn[]> => {
  const response = await api.get(
    `/sign-ins/employee/${employeeId}/history?startDate=${startDate}&endDate=${endDate}`
  ) as SignInsResponse;
  return response.data;
};

/**
 * Sign in a single employee
 */
export const signIn = async (data: Omit<SignInFormData, 'employeeIds'> & { employeeId: string }): Promise<DailySignIn> => {
  const response = await api.post('/sign-ins', data) as SignInResponse;
  return response.data;
};

/**
 * Bulk sign in multiple employees
 */
export const bulkSignIn = async (data: SignInFormData): Promise<BulkSignInResult> => {
  const response = await api.post('/sign-ins/bulk', data) as { success: boolean; data: BulkSignInResult };
  return response.data;
};

/**
 * Sign out an employee
 */
export const signOut = async (signInId: string, signOutTime: string): Promise<DailySignIn> => {
  const response = await api.put(`/sign-ins/${signInId}/sign-out`, {
    signOutTime,
  }) as SignInResponse;
  return response.data;
};

/**
 * Check if employee is signed in for a date
 */
export const isEmployeeSignedIn = async (
  employeeId: string,
  date: string
): Promise<boolean> => {
  try {
    const signIns = await getSignInsForDate(date, { employeeId });
    return signIns.length > 0;
  } catch (error) {
    return false;
  }
};

export default {
  getTodaySignIns,
  getSignInsForDate,
  getActiveSignIns,
  getEmployeeHistory,
  signIn,
  bulkSignIn,
  signOut,
  isEmployeeSignedIn,
};

