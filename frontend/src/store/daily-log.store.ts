/**
 * Daily Log Store
 * 
 * Zustand store for managing daily log state including CRUD operations,
 * filtering, pagination, and statistics for construction daily reports.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import dailyLogService from '../services/daily-log.service';
import { 
  DailyLog, 
  CreateDailyLogData, 
  UpdateDailyLogData, 
  DailyLogFilters, 
  DailyLogPaginationOptions,
  DailyLogsResponse,
  DailyLogResponse,
  DailyLogStatsResponse
} from '../services/daily-log.service';

export interface DailyLogState {
  // Daily logs list state
  dailyLogs: DailyLog[];
  totalDailyLogs: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Current daily log state
  currentDailyLog: DailyLog | null;
  
  // Filters and search
  filters: DailyLogFilters;
  searchQuery: string;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isLoadingStats: boolean;
  
  // Error states
  error: string | null;
  statsError: string | null;
  
  // Statistics
  stats: {
    totalLogs: number;
    thisMonthLogs: number;
    thisWeekLogs: number;
    recentLogs: DailyLog[];
  } | null;
  
  // Actions
  setDailyLogs: (dailyLogs: DailyLog[], total: number) => void;
  setCurrentDailyLog: (dailyLog: DailyLog | null) => void;
  setFilters: (filters: DailyLogFilters) => void;
  setSearchQuery: (query: string) => void;
  setPagination: (page: number, pageSize: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStats: (stats: any) => void;
  
  // Async actions
  loadDailyLogs: (filters?: DailyLogFilters, pagination?: DailyLogPaginationOptions) => Promise<void>;
  loadDailyLogById: (id: string) => Promise<void>;
  createDailyLog: (data: CreateDailyLogData) => Promise<DailyLog | null>;
  updateDailyLog: (id: string, data: UpdateDailyLogData) => Promise<DailyLog | null>;
  deleteDailyLog: (id: string) => Promise<boolean>;
  loadDailyLogsByProject: (projectId: string, pagination?: DailyLogPaginationOptions) => Promise<void>;
  loadDailyLogsByDateRange: (dateFrom: string, dateTo: string, pagination?: DailyLogPaginationOptions) => Promise<void>;
  loadDailyLogStats: (projectId?: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  dailyLogs: [],
  totalDailyLogs: 0,
  currentPage: 0,
  pageSize: 20,
  totalPages: 0,
  currentDailyLog: null,
  filters: {},
  searchQuery: '',
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isLoadingStats: false,
  error: null,
  statsError: null,
  stats: null,
};

export const useDailyLogStore = create<DailyLogState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Synchronous actions
      setDailyLogs: (dailyLogs, total) => set({ dailyLogs, totalDailyLogs: total }),
      setCurrentDailyLog: (dailyLog) => set({ currentDailyLog: dailyLog }),
      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setPagination: (page, pageSize) => set({ currentPage: page, pageSize: pageSize }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setStats: (stats) => set({ stats }),

      // Async actions
      loadDailyLogs: async (filters = {}, pagination = {}) => {
        set({ isLoading: true, error: null });
        try {
          const currentFilters = { ...get().filters, ...filters };
          const currentPagination = { page: get().currentPage, limit: get().pageSize, ...pagination };
          const response = await dailyLogService.getAllDailyLogs(currentFilters, currentPagination);
          
          if (response.success) {
            set({
              dailyLogs: response.data.dailyLogs,
              totalDailyLogs: response.data.pagination.total,
              currentPage: response.data.pagination.page,
              pageSize: response.data.pagination.limit,
              totalPages: response.data.pagination.totalPages,
              filters: currentFilters,
            });
          } else {
            set({ error: response.message || 'Failed to load daily logs' });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to load daily logs' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadDailyLogById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await dailyLogService.getDailyLogById(id);
          if (response.success) {
            set({ currentDailyLog: response.data });
          } else {
            set({ error: response.message || 'Failed to load daily log' });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to load daily log' });
        } finally {
          set({ isLoading: false });
        }
      },

      createDailyLog: async (data) => {
        set({ isCreating: true, error: null });
        try {
          const response = await dailyLogService.createDailyLog(data);
          if (response.success) {
            get().loadDailyLogs(get().filters, { page: get().currentPage, limit: get().pageSize }); // Refresh list
            return response.data;
          } else {
            set({ error: response.message || 'Failed to create daily log' });
            return null;
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to create daily log' });
          return null;
        } finally {
          set({ isCreating: false });
        }
      },

      updateDailyLog: async (id, data) => {
        set({ isUpdating: true, error: null });
        try {
          const response = await dailyLogService.updateDailyLog(id, data);
          if (response.success) {
            get().loadDailyLogs(get().filters, { page: get().currentPage, limit: get().pageSize }); // Refresh list
            if (get().currentDailyLog?.id === id) {
              set((state) => ({ currentDailyLog: { ...state.currentDailyLog!, ...response.data } }));
            }
            return response.data;
          } else {
            set({ error: response.message || 'Failed to update daily log' });
            return null;
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to update daily log' });
          return null;
        } finally {
          set({ isUpdating: false });
        }
      },

      deleteDailyLog: async (id) => {
        set({ isDeleting: true, error: null });
        try {
          const response = await dailyLogService.deleteDailyLog(id);
          if (response.success) {
            get().loadDailyLogs(get().filters, { page: get().currentPage, limit: get().pageSize }); // Refresh list
            if (get().currentDailyLog?.id === id) {
              set({ currentDailyLog: null });
            }
            return true;
          } else {
            set({ error: response.message || 'Failed to delete daily log' });
            return false;
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to delete daily log' });
          return false;
        } finally {
          set({ isDeleting: false });
        }
      },

      loadDailyLogsByProject: async (projectId, pagination = {}) => {
        set({ isLoading: true, error: null });
        try {
          const currentPagination = { page: get().currentPage, limit: get().pageSize, ...pagination };
          const response = await dailyLogService.getDailyLogsByProject(projectId, currentPagination);
          
          if (response.success) {
            set({
              dailyLogs: response.data.dailyLogs,
              totalDailyLogs: response.data.pagination.total,
              currentPage: response.data.pagination.page,
              pageSize: response.data.pagination.limit,
              totalPages: response.data.pagination.totalPages,
            });
          } else {
            set({ error: response.message || 'Failed to load project daily logs' });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to load project daily logs' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadDailyLogsByDateRange: async (dateFrom, dateTo, pagination = {}) => {
        set({ isLoading: true, error: null });
        try {
          const currentPagination = { page: get().currentPage, limit: get().pageSize, ...pagination };
          const response = await dailyLogService.getDailyLogsByDateRange(dateFrom, dateTo, currentPagination);
          
          if (response.success) {
            set({
              dailyLogs: response.data.dailyLogs,
              totalDailyLogs: response.data.pagination.total,
              currentPage: response.data.pagination.page,
              pageSize: response.data.pagination.limit,
              totalPages: response.data.pagination.totalPages,
            });
          } else {
            set({ error: response.message || 'Failed to load date range daily logs' });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to load date range daily logs' });
        } finally {
          set({ isLoading: false });
        }
      },

      loadDailyLogStats: async (projectId) => {
        set({ isLoadingStats: true, statsError: null });
        try {
          const response = await dailyLogService.getDailyLogStats(projectId);
          if (response.success) {
            set({ stats: response.data });
          } else {
            set({ statsError: response.message || 'Failed to load daily log statistics' });
          }
        } catch (error: any) {
          set({ statsError: error.message || 'Failed to load daily log statistics' });
        } finally {
          set({ isLoadingStats: false });
        }
      },

      // Utility actions
      clearError: () => set({ error: null, statsError: null }),
      reset: () => set(initialState),
    }),
    {
      name: 'daily-log-store',
    }
  )
);

// Export individual selectors for better performance
export const useDailyLogs = () => useDailyLogStore((state) => state.dailyLogs);
export const useCurrentDailyLog = () => useDailyLogStore((state) => state.currentDailyLog);
export const useDailyLogLoading = () => useDailyLogStore((state) => state.isLoading);
export const useDailyLogError = () => useDailyLogStore((state) => state.error);
export const useDailyLogStats = () => useDailyLogStore((state) => state.stats);
export const useDailyLogActions = () => {
  const loadDailyLogs = useDailyLogStore((state) => state.loadDailyLogs);
  const loadDailyLogById = useDailyLogStore((state) => state.loadDailyLogById);
  const createDailyLog = useDailyLogStore((state) => state.createDailyLog);
  const updateDailyLog = useDailyLogStore((state) => state.updateDailyLog);
  const deleteDailyLog = useDailyLogStore((state) => state.deleteDailyLog);
  const loadDailyLogsByProject = useDailyLogStore((state) => state.loadDailyLogsByProject);
  const loadDailyLogsByDateRange = useDailyLogStore((state) => state.loadDailyLogsByDateRange);
  const loadDailyLogStats = useDailyLogStore((state) => state.loadDailyLogStats);
  const clearError = useDailyLogStore((state) => state.clearError);
  const reset = useDailyLogStore((state) => state.reset);

  return {
    loadDailyLogs,
    loadDailyLogById,
    createDailyLog,
    updateDailyLog,
    deleteDailyLog,
    loadDailyLogsByProject,
    loadDailyLogsByDateRange,
    loadDailyLogStats,
    clearError,
    reset,
  };
};

export default useDailyLogStore;
