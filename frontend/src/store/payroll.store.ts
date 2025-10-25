import { create } from 'zustand';
import {
  DailyReport,
  WeeklyReport,
  ProjectCostReport,
  PayrollSummary,
} from '../types/timekeeping.types';
import * as payrollService from '../services/payroll.service';

interface PayrollState {
  // State
  dailyReport: DailyReport | null;
  weeklyReport: WeeklyReport | null;
  projectCostReport: ProjectCostReport | null;
  summary: PayrollSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDailyReport: (date: string) => Promise<void>;
  fetchWeeklyReport: (startDate: string, endDate: string) => Promise<void>;
  fetchProjectCostReport: (projectId: string, startDate: string, endDate: string) => Promise<void>;
  fetchPayrollSummary: (startDate: string, endDate: string) => Promise<void>;
  downloadDailyCSV: (date: string) => Promise<void>;
  downloadWeeklyCSV: (startDate: string, endDate: string) => Promise<void>;
  clearError: () => void;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  // Initial state
  dailyReport: null,
  weeklyReport: null,
  projectCostReport: null,
  summary: null,
  isLoading: false,
  error: null,

  // Fetch daily payroll report
  fetchDailyReport: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const dailyReport = await payrollService.getDailyReport(date);
      set({ dailyReport, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch daily report';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Fetch weekly payroll report
  fetchWeeklyReport: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const weeklyReport = await payrollService.getWeeklyReport(startDate, endDate);
      set({ weeklyReport, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch weekly report';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Fetch project cost report
  fetchProjectCostReport: async (projectId, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const projectCostReport = await payrollService.getProjectCostReport(
        projectId,
        startDate,
        endDate
      );
      set({ projectCostReport, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch project cost report';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Fetch payroll summary
  fetchPayrollSummary: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await payrollService.getPayrollSummary(startDate, endDate);
      set({ summary, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch payroll summary';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Download daily CSV
  downloadDailyCSV: async (date) => {
    set({ isLoading: true, error: null });
    try {
      await payrollService.downloadDailyCSV(date);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to download daily CSV';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Download weekly CSV
  downloadWeeklyCSV: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      await payrollService.downloadWeeklyCSV(startDate, endDate);
      set({ isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error||message || error?.message || 'Failed to download weekly CSV';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

