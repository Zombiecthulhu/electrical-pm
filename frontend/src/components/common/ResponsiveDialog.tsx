/**
 * Responsive Dialog Component
 * 
 * Dialog that automatically becomes full-screen on mobile devices.
 * Provides better UX on small screens.
 */

import React from 'react';
import {
  Dialog,
  DialogProps,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Slide,
  AppBar,
  Toolbar,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Close as CloseIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useMobileView } from '../../hooks';

// Slide transition for mobile
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ResponsiveDialogProps extends Omit<DialogProps, 'fullScreen'> {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
  fullScreenOnMobile?: boolean;
  showCloseButton?: boolean;
}

/**
 * Responsive Dialog
 * 
 * Automatically full-screen on mobile, modal on desktop.
 */
export const ResponsiveDialog: React.FC<ResponsiveDialogProps> = ({
  title,
  children,
  actions,
  onClose,
  fullScreenOnMobile = true,
  showCloseButton = true,
  ...dialogProps
}) => {
  const isMobile = useMobileView();
  const isFullScreen = fullScreenOnMobile && isMobile;

  return (
    <Dialog
      {...dialogProps}
      fullScreen={isFullScreen}
      onClose={onClose}
      TransitionComponent={isFullScreen ? SlideTransition : undefined}
      maxWidth={dialogProps.maxWidth || 'sm'}
      fullWidth={dialogProps.fullWidth !== false}
      PaperProps={{
        ...dialogProps.PaperProps,
        sx: {
          ...(dialogProps.PaperProps?.sx || {}),
          minHeight: isFullScreen ? '100vh' : 'auto',
        },
      }}
    >
      {isFullScreen ? (
        // Mobile: AppBar-style header
        <AppBar sx={{ position: 'relative' }} elevation={1}>
          <Toolbar>
            {showCloseButton && onClose && (
              <IconButton
                edge="start"
                color="inherit"
                onClick={onClose}
                aria-label="close"
                sx={{ mr: 2, width: 48, height: 48 }}
              >
                <BackIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
      ) : (
        // Desktop: Standard dialog title
        title && (
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">{title}</Typography>
              {showCloseButton && onClose && (
                <IconButton
                  aria-label="close"
                  onClick={onClose}
                  sx={{ width: 44, height: 44 }}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          </DialogTitle>
        )
      )}

      <DialogContent
        sx={{
          pt: isFullScreen ? 2 : 3,
          pb: isFullScreen && actions ? 10 : 3, // Space for fixed actions
        }}
      >
        {children}
      </DialogContent>

      {actions && (
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            position: isFullScreen ? 'fixed' : 'relative',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'background.paper',
            borderTop: isFullScreen ? 1 : 0,
            borderColor: 'divider',
            zIndex: 1,
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

/**
 * Form Dialog - Optimized for forms
 */
export const ResponsiveFormDialog: React.FC<
  ResponsiveDialogProps & {
    onSubmit?: () => void;
    submitLabel?: string;
    cancelLabel?: string;
    isSubmitting?: boolean;
  }
> = ({
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  onClose,
  actions,
  ...props
}) => {
  const isMobile = useMobileView();

  const defaultActions = actions || (
    <Box
      display="flex"
      gap={2}
      width={isMobile ? '100%' : 'auto'}
      flexDirection={isMobile ? 'column-reverse' : 'row'}
    >
      <button
        onClick={onClose}
        disabled={isSubmitting}
        style={{
          minWidth: isMobile ? '100%' : '80px',
          minHeight: '44px',
          padding: '8px 16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {cancelLabel}
      </button>
      {onSubmit && (
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          style={{
            minWidth: isMobile ? '100%' : '80px',
            minHeight: '44px',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: isSubmitting ? '#ccc' : '#1976d2',
            color: 'white',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      )}
    </Box>
  );

  return <ResponsiveDialog {...props} onClose={onClose} actions={defaultActions} />;
};

export default ResponsiveDialog;

