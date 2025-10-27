/**
 * Daily Log Management Page
 * 
 * Main page for managing daily logs with list, form, and detail views
 * for construction daily reports.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { useDailyLogStore, useDailyLogs, useCurrentDailyLog, useDailyLogLoading, useDailyLogError, useDailyLogActions } from '../store/daily-log.store';
import DailyLogList from '../components/modules/DailyLogList';
import DailyLogForm from '../components/modules/DailyLogForm';
import DailyLogDetail from '../components/modules/DailyLogDetail';
import { DailyLog, CreateDailyLogData, UpdateDailyLogData } from '../services/daily-log.service';

const DailyLogManagement: React.FC = () => {
  // State for UI
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingDailyLog, setEditingDailyLog] = useState<DailyLog | null>(null);
  const [deletingDailyLog, setDeletingDailyLog] = useState<DailyLog | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Store state
  const dailyLogs = useDailyLogs();
  const currentDailyLog = useCurrentDailyLog();
  const isLoading = useDailyLogLoading();
  const error = useDailyLogError();
  const {
    loadDailyLogs,
    loadDailyLogById,
    createDailyLog,
    updateDailyLog,
    deleteDailyLog,
    clearError,
  } = useDailyLogActions();

  // Load daily logs on mount
  useEffect(() => {
    loadDailyLogs();
  }, []); // Empty dependency array - only run on mount

  // Handle create daily log
  const handleCreateDailyLog = () => {
    setEditingDailyLog(null);
    setFormOpen(true);
  };

  // Handle view daily log
  const handleViewDailyLog = async (dailyLog: DailyLog) => {
    try {
      await loadDailyLogById(dailyLog.id);
      setDetailOpen(true);
    } catch (error) {
      showSnackbar('Failed to load daily log details', 'error');
    }
  };

  // Handle edit daily log
  const handleEditDailyLog = (dailyLog: DailyLog) => {
    setEditingDailyLog(dailyLog);
    setFormOpen(true);
  };

  // Handle delete daily log
  const handleDeleteDailyLog = (dailyLog: DailyLog) => {
    setDeletingDailyLog(dailyLog);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingDailyLog) return;

    try {
      const success = await deleteDailyLog(deletingDailyLog.id);
      if (success) {
        showSnackbar('Daily log deleted successfully', 'success');
        setDetailOpen(false); // Close detail if viewing deleted log
      } else {
        showSnackbar('Failed to delete daily log', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to delete daily log', 'error');
    } finally {
      setDeletingDailyLog(null);
    }
  };

  // Handle form save
  const handleFormSave = async (data: CreateDailyLogData | UpdateDailyLogData) => {
    try {
      let result: DailyLog | null = null;
      
      if (editingDailyLog) {
        // Update existing daily log
        result = await updateDailyLog(editingDailyLog.id, data as UpdateDailyLogData);
        if (result) {
          showSnackbar('Daily log updated successfully', 'success');
        }
      } else {
        // Create new daily log
        result = await createDailyLog(data as CreateDailyLogData);
        if (result) {
          showSnackbar('Daily log created successfully', 'success');
        }
      }

      if (result) {
        setFormOpen(false);
        setEditingDailyLog(null);
      }
    } catch (error) {
      showSnackbar('Failed to save daily log', 'error');
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setFormOpen(false);
    setEditingDailyLog(null);
  };

  // Handle detail close
  const handleDetailClose = () => {
    setDetailOpen(false);
  };

  // Handle detail edit
  const handleDetailEdit = (dailyLog: DailyLog) => {
    setDetailOpen(false);
    setEditingDailyLog(dailyLog);
    setFormOpen(true);
  };

  // Handle detail delete
  const handleDetailDelete = (dailyLog: DailyLog) => {
    setDetailOpen(false);
    setDeletingDailyLog(dailyLog);
  };

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle error clear
  const handleErrorClear = () => {
    clearError();
  };

  return (
    <Box>
      {/* Page Title */}
      <Typography variant="h4" gutterBottom>
        Daily Log Management
      </Typography>

      {/* Daily Log List */}
      <DailyLogList
        dailyLogs={dailyLogs}
        totalDailyLogs={useDailyLogStore.getState().totalDailyLogs}
        currentPage={useDailyLogStore.getState().currentPage}
        pageSize={useDailyLogStore.getState().pageSize}
        totalPages={useDailyLogStore.getState().totalPages}
        isLoading={isLoading}
        error={error}
        onLoadDailyLogs={loadDailyLogs}
        onView={handleViewDailyLog}
        onEdit={handleEditDailyLog}
        onDelete={handleDeleteDailyLog}
        onCreate={handleCreateDailyLog}
      />

      {/* Create/Edit Form Dialog */}
      <Dialog
        open={formOpen}
        onClose={handleFormCancel}
        maxWidth="md"
        fullWidth
        fullScreen
      >
        <DialogTitle>
          {editingDailyLog ? 'Edit Daily Log' : 'Create Daily Log'}
        </DialogTitle>
        <DialogContent>
          <DailyLogForm
            dailyLog={editingDailyLog}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isLoading={useDailyLogStore.getState().isCreating || useDailyLogStore.getState().isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog
        open={detailOpen}
        onClose={handleDetailClose}
        maxWidth="lg"
        fullWidth
        fullScreen
      >
        <DialogContent>
          <DailyLogDetail
            dailyLog={currentDailyLog}
            isLoading={isLoading}
            error={error}
            onEdit={handleDetailEdit}
            onDelete={handleDetailDelete}
            onBack={handleDetailClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingDailyLog}
        onClose={() => setDeletingDailyLog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this daily log? This action cannot be undone.
          </Typography>
          {deletingDailyLog && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Project: {deletingDailyLog.project?.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Date: {new Date(deletingDailyLog.date).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <Box display="flex" justifyContent="flex-end" gap={1} p={2}>
          <button
            onClick={() => setDeletingDailyLog(null)}
            style={{ padding: '8px 16px', marginRight: '8px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#d32f2f', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Delete
          </button>
        </Box>
      </Dialog>

      {/* Error Snackbar */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleErrorClear}
        >
          <Alert onClose={handleErrorClear} severity="error">
            {error}
          </Alert>
        </Snackbar>
      )}

      {/* Success/Info Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Backdrop */}
      <Backdrop
        open={useDailyLogStore.getState().isDeleting}
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>Deleting daily log...</Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default DailyLogManagement;
