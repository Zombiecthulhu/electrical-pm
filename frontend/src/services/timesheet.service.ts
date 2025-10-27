import api from './api';

/**
 * Timesheet Service
 * Frontend API client for timesheet operations
 */

// Types
export interface Timesheet {
  id: string;
  date: string;
  status: string;
  title?: string;
  notes?: string;
  submittedAt?: string;
  submittedBy?: string;
  submittedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  approvedBy?: string;
  approvedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdBy: string;
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  timeEntries?: TimeEntry[];
  entryCount?: number;
}

export interface TimeEntry {
  id?: string;
  timesheetId?: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    classification: string;
  };
  date?: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
    projectNumber: string;
  };
  hoursWorked: number;
  workType?: string;
  description?: string;
  taskPerformed?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTimesheetData {
  date: string;
  title?: string;
  notes?: string;
  employeeIds: string[];
  timeEntries: TimeEntry[];
}

export interface UpdateTimesheetData {
  title?: string;
  notes?: string;
  status?: string;
  timeEntries?: TimeEntry[];
}

interface TimesheetsResponse {
  success: boolean;
  data: Timesheet[];
}

interface TimesheetResponse {
  success: boolean;
  data: Timesheet;
  message?: string;
}

/**
 * Get all timesheets with optional filters
 */
export const getAllTimesheets = async (filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}): Promise<Timesheet[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.createdBy) params.append('createdBy', filters.createdBy);

  const response = await api.get(
    `/timesheets${params.toString() ? `?${params.toString()}` : ''}`
  );

  return response.data;
};

/**
 * Get timesheets for a specific date
 */
export const getTimesheetsForDate = async (date: string): Promise<Timesheet[]> => {
  const response = await api.get(`/timesheets/date/${date}`);
  return response.data;
};

/**
 * Get a single timesheet by ID
 */
export const getTimesheetById = async (id: string): Promise<Timesheet> => {
  const response = await api.get(`/timesheets/${id}`);
  return response.data;
};

/**
 * Create a new timesheet
 */
export const createTimesheet = async (data: CreateTimesheetData): Promise<Timesheet> => {
  const response = await api.post('/timesheets', data);
  return response.data;
};

/**
 * Update an existing timesheet
 */
export const updateTimesheet = async (
  id: string,
  data: UpdateTimesheetData
): Promise<Timesheet> => {
  const response = await api.put(`/timesheets/${id}`, data);
  return response.data;
};

/**
 * Submit a timesheet
 */
export const submitTimesheet = async (id: string): Promise<Timesheet> => {
  const response = await api.post(`/timesheets/${id}/submit`);
  return response.data;
};

/**
 * Approve a timesheet
 */
export const approveTimesheet = async (id: string): Promise<Timesheet> => {
  const response = await api.post(`/timesheets/${id}/approve`);
  return response.data;
};

/**
 * Delete a timesheet
 */
export const deleteTimesheet = async (id: string): Promise<void> => {
  await api.delete(`/timesheets/${id}`);
};

/**
 * Export timesheet as PDF
 */
export const exportTimesheetToPDF = async (id: string): Promise<void> => {
  // Note: axios interceptor returns response.data, so for blob responses,
  // we get the Blob directly (not wrapped in response.data)
  const blob = await api.get(`/timesheets/${id}/pdf`, {
    responseType: 'blob',
  }) as Blob;

  // Create a blob URL and trigger download
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `timesheet-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default {
  getAllTimesheets,
  getTimesheetsForDate,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  submitTimesheet,
  approveTimesheet,
  deleteTimesheet,
  exportTimesheetToPDF,
};

