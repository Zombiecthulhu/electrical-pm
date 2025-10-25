/**
 * Loading Button Component
 * 
 * Button component with built-in loading state.
 * Shows spinner and disables interaction during loading.
 */

import React from 'react';
import {
  Button,
  ButtonProps,
  CircularProgress,
} from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

/**
 * Loading Button Component
 * 
 * Extends MUI Button with loading state support.
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  startIcon,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={
        loading ? (
          <CircularProgress
            size={16}
            color="inherit"
            sx={{ ml: -0.5 }}
          />
        ) : (
          startIcon
        )
      }
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};

export default LoadingButton;

