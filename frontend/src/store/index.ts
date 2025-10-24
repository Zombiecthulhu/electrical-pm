/**
 * Store Index
 * 
 * This file exports the state management store and slices.
 * Using Zustand or Redux Toolkit for global state management.
 * 
 * Store structure (if using Zustand):
 * - authStore.ts     - Authentication state (user, token)
 * - uiStore.ts       - UI state (sidebar, theme, modals)
 * - projectStore.ts  - Project data cache
 * - clientStore.ts   - Client data cache
 * 
 * Store structure (if using Redux Toolkit):
 * - store.ts         - Redux store configuration
 * - slices/
 *   - authSlice.ts
 *   - uiSlice.ts
 *   - projectSlice.ts
 *   - clientSlice.ts
 * 
 * State management guidelines:
 * - Keep global state minimal
 * - Use local state (useState) when possible
 * - Store only shared data across components
 * - Prefer React Query for server state
 * 
 * Export pattern:
 * export { useAuthStore } from './authStore';
 * export { useUIStore } from './uiStore';
 */

// Store exports
export { useAuthStore, useUser, useIsAuthenticated, useIsLoading, useAuthError, useAuthActions, useAuth } from './auth.store';
export { useThemeStore } from './theme.store';
export { 
  useProjectStore, 
  useProjects, 
  useSelectedProject, 
  useProjectLoading, 
  useProjectError, 
  useProjectPagination, 
  useProjectFilters, 
  useProjectActions 
} from './project.store';
export { useClientStore } from './client.store';

