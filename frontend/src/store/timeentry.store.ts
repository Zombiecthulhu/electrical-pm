import { create } from 'zustand';
import {
  TimeEntry,
  TimeEntryFormData,
  BulkTimeEntryData,
} from '../types/timekeeping.types';
import * as timeEntryService from '../services/timeentry.service';

interface TimeEntryState {
  // State
  timeEntries: TimeEntry[];
  selectedDate: string;
  unapprovedEntries: TimeEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTimeEntriesForDate: (
    date: string,
    filters?: { employeeId?: string; projectId?: string; status?: string }
  ) => Promise<void>;
  fetchTimeEntriesForEmployee: (employeeId: string, startDate: string, endDate: string) => Promise<void>;
  fetchUnapprovedEntries: () => Promise<void>;
  createTimeEntry: (data: TimeEntryFormData) => Promise<TimeEntry>;
  bulkCreateTimeEntries: (entries: BulkTimeEntryData[]) => Promise<TimeEntry[]>;
  updateTimeEntry: (id: string, data: Partial<TimeEntryFormData>) => Promise<TimeEntry>;
  deleteTimeEntry: (id: string) => Promise<void>;
  approveTimeEntry: (id: string) => Promise<TimeEntry>;
  rejectTimeEntry: (id: string, reason: string) => Promise<TimeEntry>;
  setSelectedDate: (date: string) => void;
  clearError: () => void;
}

export const useTimeEntryStore = create<TimeEntryState>((set, get) => ({
  // Initial state
  timeEntries: [],
  selectedDate: new Date().toISOString().split('T')[0],
  unapprovedEntries: [],
  isLoading: false,
  error: null,

  // Fetch time entries for a specific date
  fetchTimeEntriesForDate: async (date, filters) => {
    set({ isLoading: true, error: null, selectedDate: date });
    try {
      const timeEntries = await timeEntryService.getTimeEntriesForDate(date, filters);
      set({ timeEntries: timeEntries || [], isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch time entries';
      set({ error: errorMessage, isLoading: false, timeEntries: [] });
    }
  },

  // Fetch time entries for an employee
  fetchTimeEntriesForEmployee: async (employeeId, startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const timeEntries = await timeEntryService.getTimeEntriesForEmployee(
        employeeId,
        startDate,
        endDate
      );
      set({ timeEntries: timeEntries || [], isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch employee time entries';
      set({ error: errorMessage, isLoading: false, timeEntries: [] });
    }
  },

  // Fetch unapproved time entries
  fetchUnapprovedEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const unapprovedEntries = await timeEntryService.getUnapprovedEntries();
      set({ unapprovedEntries: unapprovedEntries || [], isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch unapproved entries';
      set({ error: errorMessage, isLoading: false, unapprovedEntries: [] });
    }
  },

  // Create a time entry
  createTimeEntry: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const timeEntry = await timeEntryService.createTimeEntry(data);
      
      // Add to timeEntries array
      set((state) => ({
        timeEntries: [timeEntry, ...state.timeEntries],
        isLoading: false,
      }));

      return timeEntry;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to create time entry';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Bulk create time entries
  bulkCreateTimeEntries: async (entries) => {
    set({ isLoading: true, error: null });
    try {
      const createdEntries = await timeEntryService.bulkCreateTimeEntries(entries);
      
      // Add to timeEntries array
      set((state) => ({
        timeEntries: [...createdEntries, ...state.timeEntries],
        isLoading: false,
      }));

      return createdEntries;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to create time entries';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Update a time entry
  updateTimeEntry: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedEntry = await timeEntryService.updateTimeEntry(id, data);
      
      // Update in timeEntries array
      set((state) => ({
        timeEntries: state.timeEntries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
        isLoading: false,
      }));

      return updatedEntry;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to update time entry';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Delete a time entry
  deleteTimeEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await timeEntryService.deleteTimeEntry(id);
      
      // Remove from arrays
      set((state) => ({
        timeEntries: state.timeEntries.filter((entry) => entry.id !== id),
        unapprovedEntries: state.unapprovedEntries.filter((entry) => entry.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to delete time entry';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Approve a time entry
  approveTimeEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const approvedEntry = await timeEntryService.approveTimeEntry(id);
      
      // Update in arrays
      set((state) => ({
        timeEntries: state.timeEntries.map((entry) =>
          entry.id === id ? approvedEntry : entry
        ),
        unapprovedEntries: state.unapprovedEntries.filter((entry) => entry.id !== id),
        isLoading: false,
      }));

      return approvedEntry;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to approve time entry';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Reject a time entry
  rejectTimeEntry: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      const rejectedEntry = await timeEntryService.rejectTimeEntry(id, reason);
      
      // Update in arrays
      set((state) => ({
        timeEntries: state.timeEntries.map((entry) =>
          entry.id === id ? rejectedEntry : entry
        ),
        unapprovedEntries: state.unapprovedEntries.filter((entry) => entry.id !== id),
        isLoading: false,
      }));

      return rejectedEntry;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to reject time entry';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Set selected date
  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

