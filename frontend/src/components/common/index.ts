/**
 * Common Components Index
 * 
 * This file exports all reusable common components.
 * Common components are used across multiple modules and pages.
 * 
 * Component categories:
 * - Buttons (primary, secondary, icon buttons)
 * - Form elements (inputs, selects, checkboxes, etc.)
 * - Cards and containers
 * - Modals and dialogs
 * - Loading states and spinners
 * - Empty states
 * - Alerts and notifications
 * 
 * Export pattern:
 * export { Button } from './Button';
 * export { Input } from './Input';
 * export { Card } from './Card';
 * export { Modal } from './Modal';
 */

// Common components will be exported here as they are created
export { default as ServerStatus } from './ServerStatus';

// UX Enhancement Components
export {
  EmptyState,
  EmptySearchState,
  EmptyFilterState,
  ErrorState,
  OfflineState,
  EmptyProjectsState,
  EmptyClientsState,
  EmptyDailyLogsState,
  EmptyQuotesState,
  EmptyFilesState,
  EmptyDocumentsState,
  EmptyStateCard,
} from './EmptyState';

export {
  ConfirmDialog,
  DeleteConfirmDialog,
  useConfirmDialog,
} from './ConfirmDialog';

export { LoadingButton } from './LoadingButton';

export { MobileListView, SimpleMobileList } from './MobileListView';
export type { MobileListItem } from './MobileListView';

export { ResponsiveDialog, ResponsiveFormDialog } from './ResponsiveDialog';

export {
  ResponsiveFormWrapper,
  FormRow,
  FormActions,
  FormSection,
  mobileFormFieldProps,
  mobileButtonProps,
} from './ResponsiveFormWrapper';

// Loading Skeletons for performance and UX
export {
  TableSkeleton,
  CardSkeleton,
  ListSkeleton,
  FormSkeleton,
  DetailSkeleton,
  DashboardCardSkeleton,
  ImageGridSkeleton,
} from './LoadingSkeletons';

// Lazy Loading Images for performance
export { LazyImage, LazyThumbnail, LazyBackgroundImage } from './LazyImage';

// Session Management
export { default as SessionTimeout } from './SessionTimeout';

// File components - old versions, use FileManager instead
// export { default as FileUpload } from './FileUpload';
// export { default as FileList } from './FileList';

