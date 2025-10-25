/**
 * Custom Hooks Index
 * 
 * This file exports all custom React hooks.
 * Custom hooks encapsulate reusable stateful logic.
 * 
 * Hook categories:
 * - useAuth.ts          - Authentication state and actions
 * - useApi.ts           - API request wrapper with loading/error states
 * - useDebounce.ts      - Debounced value hook
 * - useLocalStorage.ts  - LocalStorage state management
 * - useMediaQuery.ts    - Responsive design breakpoints
 * - useForm.ts          - Form state management
 * - usePagination.ts    - Pagination state and logic
 * - usePermissions.ts   - User permission checks
 * - useToast.ts         - Toast notification system
 * 
 * Hook naming convention:
 * - Prefix with "use" (React convention)
 * - Use camelCase
 * - Be descriptive
 * 
 * Hook guidelines:
 * - Extract reusable stateful logic
 * - Keep hooks focused and single-purpose
 * - Return arrays or objects consistently
 * - Document parameters and return values
 * 
 * Export pattern:
 * export { useAuth } from './useAuth';
 * export { useApi } from './useApi';
 * export { useDebounce } from './useDebounce';
 */

// File upload hook - old version, use FileManager instead
// export { useFileUpload } from './useFileUpload';
// export type { FileUploadState, FileUploadOptions, FileUploadResult } from './useFileUpload';

// Notification hook
export { useNotification } from './useNotification';

// Keyboard hooks
export {
  useKeyboardShortcut,
  useEscapeKey,
  useEnterKey,
  useModalKeyboard,
  useClickOutside,
  useFocusTrap,
} from './useKeyboard';

// Responsive hooks
export {
  useMobileView,
  useTabletView,
  useDesktopView,
  useSmallScreen,
  useCompactView,
  useBreakpoint,
  useBreakpointUp,
  useBreakpointDown,
  useOrientation,
  useTouchDevice,
  useResponsiveValue,
  useResponsive,
} from './useResponsive';

// Make this a module
export {};

