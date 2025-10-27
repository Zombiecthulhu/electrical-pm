import api from './api';
import {
  TimeEntry,
  TimeEntryFormData,
  BulkTimeEntryData,
  DayTotal,
  TimeEntryResponse,
  TimeEntriesResponse,
} from '../types/timekeeping.types';

/**
 * Time Entry Service
 * Frontend API client for project time allocation
 */

/**
 * Get time entries for a specific date
 */
export const getTimeEntriesForDate = async (
  date: string,
  filters?: {
    employeeId?: string;
    projectId?: string;
    status?: string;
  }
): Promise<TimeEntry[]> => {
  const params = new URLSearchParams({ date });
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.projectId) params.append('projectId', filters.projectId);
  if (filters?.status) params.append('status', filters.status);

  const response = await api.get(`/time-entries/date?${params.toString()}`) as TimeEntriesResponse;
  return response.data;
};

/**
 * Get time entries for an employee
 */
export const getTimeEntriesForEmployee = async (
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<TimeEntry[]> => {
  const response = await api.get(
    `/time-entries/employee/${employeeId}?startDate=${startDate}&endDate=${endDate}`
  ) as TimeEntriesResponse;
  return response.data;
};

/**
 * Get time entries for a project
 */
export const getTimeEntriesForProject = async (
  projectId: string,
  startDate: string,
  endDate: string
): Promise<TimeEntry[]> => {
  const response = await api.get(
    `/time-entries/project/${projectId}?startDate=${startDate}&endDate=${endDate}`
  ) as TimeEntriesResponse;
  return response.data;
};

/**
 * Get unapproved time entries
 */
export const getUnapprovedEntries = async (): Promise<TimeEntry[]> => {
  const response = await api.get('/time-entries/unapproved') as TimeEntriesResponse;
  return response.data;
};

/**
 * Calculate day total for an employee
 */
export const calculateDayTotal = async (
  employeeId: string,
  date: string
): Promise<number> => {
  const response = await api.get(
    `/time-entries/${employeeId}/${date}/total`
  ) as { success: boolean; data: DayTotal };
  return response.data.totalHours;
};

/**
 * Create a time entry
 */
export const createTimeEntry = async (data: TimeEntryFormData): Promise<TimeEntry> => {
  const response = await api.post('/time-entries', data) as TimeEntryResponse;
  return response.data;
};

/**
 * Bulk create time entries
 */
export const bulkCreateTimeEntries = async (
  entries: BulkTimeEntryData[]
): Promise<TimeEntry[]> => {
  const response = await api.post('/time-entries/bulk', {
    entries,
  }) as TimeEntriesResponse;
  return response.data;
};

/**
 * Update a time entry
 */
export const updateTimeEntry = async (
  id: string,
  data: Partial<TimeEntryFormData>
): Promise<TimeEntry> => {
  const response = await api.put(`/time-entries/${id}`, data) as TimeEntryResponse;
  return response.data;
};

/**
 * Delete a time entry
 */
export const deleteTimeEntry = async (id: string): Promise<void> => {
  await api.delete(`/time-entries/${id}`);
};

/**
 * Approve a time entry
 */
export const approveTimeEntry = async (id: string): Promise<TimeEntry> => {
  const response = await api.put(`/time-entries/${id}/approve`) as TimeEntryResponse;
  return response.data;
};

/**
 * Reject a time entry
 */
export const rejectTimeEntry = async (id: string, reason: string): Promise<TimeEntry> => {
  const response = await api.put(`/time-entries/${id}/reject`, {
    reason,
  }) as TimeEntryResponse;
  return response.data;
};

/**
 * Auto-create time entry from sign-in
 */
export const autoCreateFromSignIn = async (
  signInId: string,
  projectId: string
): Promise<TimeEntry> => {
  const response = await api.post('/time-entries/auto-create', {
    signInId,
    projectId,
  }) as TimeEntryResponse;
  return response.data;
};

export default {
  getTimeEntriesForDate,
  getTimeEntriesForEmployee,
  getTimeEntriesForProject,
  getUnapprovedEntries,
  calculateDayTotal,
  createTimeEntry,
  bulkCreateTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  approveTimeEntry,
  rejectTimeEntry,
  autoCreateFromSignIn,
};

