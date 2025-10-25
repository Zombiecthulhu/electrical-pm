import api from './api';
import {
  DailyReport,
  WeeklyReport,
  ProjectCostReport,
  PayrollSummary,
  DailyReportResponse,
  WeeklyReportResponse,
  ProjectCostReportResponse,
  PayrollSummaryResponse,
} from '../types/timekeeping.types';

/**
 * Payroll Service
 * Frontend API client for payroll reports and CSV exports
 */

/**
 * Get daily payroll report
 */
export const getDailyReport = async (date: string): Promise<DailyReport> => {
  const response = await api.get<DailyReportResponse>(`/payroll/daily?date=${date}`);
  return response.data;
};

/**
 * Get weekly payroll report
 */
export const getWeeklyReport = async (
  startDate: string,
  endDate: string
): Promise<WeeklyReport> => {
  const response = await api.get<WeeklyReportResponse>(
    `/payroll/weekly?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};

/**
 * Get project cost report
 */
export const getProjectCostReport = async (
  projectId: string,
  startDate: string,
  endDate: string
): Promise<ProjectCostReport> => {
  const response = await api.get<ProjectCostReportResponse>(
    `/payroll/project/${projectId}?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};

/**
 * Get payroll summary statistics
 */
export const getPayrollSummary = async (
  startDate: string,
  endDate: string
): Promise<PayrollSummary> => {
  const response = await api.get<PayrollSummaryResponse>(
    `/payroll/summary?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};

/**
 * Download daily report as CSV
 * Triggers browser download
 */
export const downloadDailyCSV = async (date: string): Promise<void> => {
  const response = await api.get(`/payroll/export/daily?date=${date}`, {
    responseType: 'blob',
  });

  // Create blob and trigger download
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `payroll-report-${date}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Download weekly report as CSV
 * Triggers browser download
 */
export const downloadWeeklyCSV = async (
  startDate: string,
  endDate: string
): Promise<void> => {
  const response = await api.get(
    `/payroll/export/weekly?startDate=${startDate}&endDate=${endDate}`,
    {
      responseType: 'blob',
    }
  );

  // Create blob and trigger download
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `weekly-payroll-${startDate}-to-${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default {
  getDailyReport,
  getWeeklyReport,
  getProjectCostReport,
  getPayrollSummary,
  downloadDailyCSV,
  downloadWeeklyCSV,
};

