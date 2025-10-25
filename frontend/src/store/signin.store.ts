import { create } from 'zustand';
import {
  DailySignIn,
  SignInFormData,
  BulkSignInResult,
} from '../types/timekeeping.types';
import * as signInService from '../services/signin.service';

interface SignInState {
  // State
  signIns: DailySignIn[];
  activeSignIns: DailySignIn[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTodaySignIns: () => Promise<void>;
  fetchSignInsForDate: (date: string, filters?: { employeeId?: string; projectId?: string }) => Promise<void>;
  fetchActiveSignIns: () => Promise<void>;
  signIn: (data: Omit<SignInFormData, 'employeeIds'> & { employeeId: string }) => Promise<DailySignIn>;
  bulkSignIn: (data: SignInFormData) => Promise<BulkSignInResult>;
  signOut: (signInId: string, signOutTime: string) => Promise<DailySignIn>;
  setSelectedDate: (date: string) => void;
  clearError: () => void;
}

export const useSignInStore = create<SignInState>((set, get) => ({
  // Initial state
  signIns: [],
  activeSignIns: [],
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  error: null,

  // Fetch today's sign-ins
  fetchTodaySignIns: async () => {
    set({ isLoading: true, error: null });
    try {
      const signIns = await signInService.getTodaySignIns();
      set({ signIns, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch sign-ins';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Fetch sign-ins for a specific date
  fetchSignInsForDate: async (date, filters) => {
    set({ isLoading: true, error: null, selectedDate: date });
    try {
      const signIns = await signInService.getSignInsForDate(date, filters);
      set({ signIns, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch sign-ins';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Fetch active sign-ins (not signed out yet)
  fetchActiveSignIns: async () => {
    set({ isLoading: true, error: null });
    try {
      const activeSignIns = await signInService.getActiveSignIns();
      set({ activeSignIns, isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to fetch active sign-ins';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Sign in an employee
  signIn: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const signIn = await signInService.signIn(data);
      
      // Add to signIns array
      set((state) => ({
        signIns: [signIn, ...state.signIns],
        activeSignIns: [signIn, ...state.activeSignIns],
        isLoading: false,
      }));

      return signIn;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to sign in employee';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Bulk sign in multiple employees
  bulkSignIn: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInService.bulkSignIn(data);
      
      // Add signed in employees to arrays
      set((state) => ({
        signIns: [...result.signedIn, ...state.signIns],
        activeSignIns: [...result.signedIn, ...state.activeSignIns],
        isLoading: false,
      }));

      return result;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to bulk sign in employees';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Sign out an employee
  signOut: async (signInId, signOutTime) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSignIn = await signInService.signOut(signInId, signOutTime);
      
      // Update in signIns array
      set((state) => ({
        signIns: state.signIns.map((s) => (s.id === signInId ? updatedSignIn : s)),
        activeSignIns: state.activeSignIns.filter((s) => s.id !== signInId),
        isLoading: false,
      }));

      return updatedSignIn;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Failed to sign out employee';
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

