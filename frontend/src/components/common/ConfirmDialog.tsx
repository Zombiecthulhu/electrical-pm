/**
 * Confirmation Dialog Component
 * 
 * Reusable confirmation dialog for delete actions and other destructive operations.
 * Provides consistent UX and prevents accidental actions.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger' | 'info';
  loading?: boolean;
}

/**
 * Confirmation Dialog Component
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  loading = false,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <ErrorIcon color="error" sx={{ fontSize: 48 }} />;
      case 'warning':
        return <WarningIcon color="warning" sx={{ fontSize: 48 }} />;
      case 'info':
        return <InfoIcon color="info" sx={{ fontSize: 48 }} />;
      default:
        return <WarningIcon color="warning" sx={{ fontSize: 48 }} />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (variant) {
      case 'danger':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const isLoading = loading || isProcessing;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          {getIcon()}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading} color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={getConfirmButtonColor()}
          disabled={isLoading}
          startIcon={
            isLoading ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Delete Confirmation Dialog
 */
export const DeleteConfirmDialog: React.FC<
  Omit<ConfirmDialogProps, 'variant' | 'title' | 'confirmText'> & {
    title?: string;
    confirmText?: string;
    itemName?: string;
  }
> = ({ title, confirmText, itemName, message, ...props }) => {
  const defaultTitle = itemName ? `Delete ${itemName}?` : 'Delete Item?';
  const defaultConfirmText = 'Delete';

  return (
    <ConfirmDialog
      {...props}
      title={title || defaultTitle}
      message={message}
      confirmText={confirmText || defaultConfirmText}
      variant="danger"
    />
  );
};

/**
 * Hook for managing confirmation dialog state
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const showConfirm = React.useCallback(
    (title: string, message: string, onConfirm: () => void | Promise<void>) => {
      setConfig({ title, message, onConfirm });
      setIsOpen(true);
    },
    []
  );

  const closeDialog = React.useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setConfig(null), 300); // Clear config after animation
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (config?.onConfirm) {
      await config.onConfirm();
      closeDialog();
    }
  }, [config, closeDialog]);

  return {
    isOpen,
    config,
    showConfirm,
    closeDialog,
    handleConfirm,
  };
};

export default ConfirmDialog;

