import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService, LoginCredentials, RegisterData, User } from '../services';

// Authentication store state interface
interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Create the authentication store
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login action
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.login(credentials);
            
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message || 'Login failed',
            });
            throw error;
          }
        },

        // Logout action
        logout: async () => {
          set({ isLoading: true });
          
          try {
            await authService.logout();
          } catch (error) {
            // Even if logout fails on server, clear local state
            console.error('Logout error:', error);
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        },

        // Register action
        register: async (userData: RegisterData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.register(userData);
            
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.message || 'Registration failed',
            });
            throw error;
          }
        },

        // Check authentication status
        checkAuth: async () => {
          set({ isLoading: true });
          
          try {
            const user = await authService.getCurrentUser();
            
            set({
              user: user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null, // Don't set error for auth check failures
            });
          }
        },

        // Set user directly (for manual updates)
        setUser: (user: User | null) => {
          set({
            user,
            isAuthenticated: !!user,
            error: null,
          });
        },

        // Set loading state
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // Set error message
        setError: (error: string | null) => {
          set({ error });
        },

        // Clear error message
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-storage', // localStorage key
        partialize: (state) => ({
          // Only persist user and isAuthenticated, not loading states
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store', // DevTools name
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Action hooks
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  register: state.register,
  checkAuth: state.checkAuth,
  setUser: state.setUser,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
}));

// Combined hook for common use cases
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
  login: state.login,
  logout: state.logout,
  register: state.register,
  checkAuth: state.checkAuth,
  clearError: state.clearError,
}));
