/**
 * useNotification Hook
 * 
 * Custom hook for displaying toast notifications consistently across the app.
 * Uses notistack for Material-UI styled notifications.
 */

import { useSnackbar, VariantType } from 'notistack';
import { useCallback } from 'react';

export interface NotificationOptions {
  variant?: VariantType;
  autoHideDuration?: number;
  preventDuplicate?: boolean;
}

export const useNotification = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showNotification = useCallback(
    (message: string, options?: NotificationOptions) => {
      return enqueueSnackbar(message, {
        variant: options?.variant || 'default',
        autoHideDuration: options?.autoHideDuration || 5000,
        preventDuplicate: options?.preventDuplicate !== false,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'right',
        },
      });
    },
    [enqueueSnackbar]
  );

  const success = useCallback(
    (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
      return showNotification(message, { ...options, variant: 'success' });
    },
    [showNotification]
  );

  const error = useCallback(
    (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
      return showNotification(message, { ...options, variant: 'error' });
    },
    [showNotification]
  );

  const warning = useCallback(
    (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
      return showNotification(message, { ...options, variant: 'warning' });
    },
    [showNotification]
  );

  const info = useCallback(
    (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
      return showNotification(message, { ...options, variant: 'info' });
    },
    [showNotification]
  );

  const close = useCallback(
    (key?: string | number) => {
      if (key) {
        closeSnackbar(key);
      } else {
        closeSnackbar();
      }
    },
    [closeSnackbar]
  );

  return {
    showNotification,
    success,
    error,
    warning,
    info,
    close,
  };
};

export default useNotification;

