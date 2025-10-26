import { create } from 'zustand';
import * as timesheetService from '../services/timesheet.service';
import { Timesheet, CreateTimesheetData, UpdateTimesheetData } from '../services/timesheet.service';

/**
 * Timesheet Store
 * Zustand store for managing timesheet state
 */

interface TimesheetState {
  timesheets: Timesheet[];
  currentTimesheet: Timesheet | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAllTimesheets: (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    createdBy?: string;
  }) => Promise<void>;
  fetchTimesheetsForDate: (date: string) => Promise<void>;
  fetchTimesheetById: (id: string) => Promise<void>;
  createTimesheet: (data: CreateTimesheetData) => Promise<Timesheet | null>;
  updateTimesheet: (id: string, data: UpdateTimesheetData) => Promise<Timesheet | null>;
  submitTimesheet: (id: string) => Promise<Timesheet | null>;
  approveTimesheet: (id: string) => Promise<Timesheet | null>;
  deleteTimesheet: (id: string) => Promise<boolean>;
  exportToPDF: (id: string) => Promise<void>;
  clearCurrentTimesheet: () => void;
  clearError: () => void;
}

export const useTimesheetStore = create<TimesheetState>((set) => ({
  timesheets: [],
  currentTimesheet: null,
  isLoading: false,
  error: null,

  /**
   * Fetch all timesheets with optional filters
   */
  fetchAllTimesheets: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const timesheets = await timesheetService.getAllTimesheets(filters);
      set({ timesheets: timesheets || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to fetch timesheets',
        isLoading: false,
      });
    }
  },

  /**
   * Fetch timesheets for a specific date
   */
  fetchTimesheetsForDate: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const timesheets = await timesheetService.getTimesheetsForDate(date);
      set({ timesheets: timesheets || [], isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to fetch timesheets for date',
        isLoading: false,
      });
    }
  },

  /**
   * Fetch a single timesheet by ID
   */
  fetchTimesheetById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const timesheet = await timesheetService.getTimesheetById(id);
      set({ currentTimesheet: timesheet, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to fetch timesheet',
        isLoading: false,
        currentTimesheet: null,
      });
    }
  },

  /**
   * Create a new timesheet
   */
  createTimesheet: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const timesheet = await timesheetService.createTimesheet(data);
      set((state) => ({
        timesheets: [timesheet, ...state.timesheets],
        currentTimesheet: timesheet,
        isLoading: false,
      }));
      return timesheet;
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to create timesheet',
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * Update an existing timesheet
   */
  updateTimesheet: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const timesheet = await timesheetService.updateTimesheet(id, data);
      set((state) => ({
        timesheets: state.timesheets.map((t) => (t.id === id ? timesheet : t)),
        currentTimesheet: state.currentTimesheet?.id === id ? timesheet : state.currentTimesheet,
        isLoading: false,
      }));
      return timesheet;
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to update timesheet',
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * Submit a timesheet
   */
  submitTimesheet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const timesheet = await timesheetService.submitTimesheet(id);
      set((state) => ({
        timesheets: state.timesheets.map((t) => (t.id === id ? timesheet : t)),
        currentTimesheet: state.currentTimesheet?.id === id ? timesheet : state.currentTimesheet,
        isLoading: false,
      }));
      return timesheet;
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to submit timesheet',
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * Approve a timesheet
   */
  approveTimesheet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const timesheet = await timesheetService.approveTimesheet(id);
      set((state) => ({
        timesheets: state.timesheets.map((t) => (t.id === id ? timesheet : t)),
        currentTimesheet: state.currentTimesheet?.id === id ? timesheet : state.currentTimesheet,
        isLoading: false,
      }));
      return timesheet;
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to approve timesheet',
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * Delete a timesheet
   */
  deleteTimesheet: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await timesheetService.deleteTimesheet(id);
      set((state) => ({
        timesheets: state.timesheets.filter((t) => t.id !== id),
        currentTimesheet: state.currentTimesheet?.id === id ? null : state.currentTimesheet,
        isLoading: false,
      }));
      return true;
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to delete timesheet',
        isLoading: false,
      });
      return false;
    }
  },

  /**
   * Export timesheet to PDF
   */
  exportToPDF: async (id) => {
    try {
      await timesheetService.exportTimesheetToPDF(id);
    } catch (error: any) {
      set({
        error: error?.response?.data?.error?.message || error.message || 'Failed to export PDF',
      });
      throw error;
    }
  },

  /**
   * Clear current timesheet
   */
  clearCurrentTimesheet: () => {
    set({ currentTimesheet: null });
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },
}));

