import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import { Check, Close, Refresh } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useTimeEntryStore } from '../../store/timeentry.store';
import { useNotification } from '../../hooks/useNotification';
import { formatDate } from '../../utils/formatters';
import { useMobileView } from '../../hooks/useResponsive';
import { MobileListView, MobileListItem } from '../../components/common';

const TimeApproval: React.FC = () => {
  const isMobile = useMobileView();
  const { showSuccess, showError } = useNotification();

  const {
    unapprovedEntries,
    isLoading,
    error,
    fetchUnapprovedEntries,
    approveTimeEntry,
    rejectTimeEntry,
    clearError,
  } = useTimeEntryStore();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchUnapprovedEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    fetchUnapprovedEntries();
  };

  const handleApprove = async (entry: any) => {
    try {
      await approveTimeEntry(entry.id);
      showSuccess(`Time entry approved for ${entry.employee.firstName} ${entry.employee.lastName}`);
      fetchUnapprovedEntries();
    } catch (error: any) {
      showError(error?.message || 'Failed to approve time entry');
    }
  };

  const handleOpenRejectDialog = (entry: any) => {
    setSelectedEntry(entry);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedEntry || !rejectReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectTimeEntry(selectedEntry.id, rejectReason);
      showSuccess(`Time entry rejected for ${selectedEntry.employee.firstName} ${selectedEntry.employee.lastName}`);
      setRejectDialogOpen(false);
      setSelectedEntry(null);
      setRejectReason('');
      fetchUnapprovedEntries();
    } catch (error: any) {
      showError(error?.message || 'Failed to reject time entry');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueGetter: (value, row) => formatDate(row.date),
    },
    {
      field: 'employee',
      headerName: 'Employee',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => `${row.employee.firstName} ${row.employee.lastName}`,
    },
    {
      field: 'project',
      headerName: 'Project',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.project.name,
    },
    {
      field: 'hoursWorked',
      headerName: 'Hours',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={`${params.value} hrs`}
          size="small"
          color={params.value > 12 ? 'warning' : 'default'}
        />
      ),
    },
    {
      field: 'workType',
      headerName: 'Type',
      width: 120,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<Check />}
            onClick={() => handleApprove(params.row)}
          >
            Approve
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Close />}
            onClick={() => handleOpenRejectDialog(params.row)}
          >
            Reject
          </Button>
        </Stack>
      ),
    },
  ];

  const mobileListItems: MobileListItem[] = unapprovedEntries.map((entry) => ({
    id: entry.id,
    title: `${entry.employee.firstName} ${entry.employee.lastName}`,
    subtitle: entry.project.name,
    description: entry.taskPerformed || entry.description || 'No description',
    metadata: [
      { label: 'Date', value: formatDate(entry.date) },
      { label: 'Hours', value: `${entry.hoursWorked} hrs` },
      { label: 'Type', value: entry.workType || 'Regular' },
    ],
    actions: [
      {
        label: 'Approve',
        onClick: () => handleApprove(entry),
        color: 'success',
      },
      {
        label: 'Reject',
        onClick: () => handleOpenRejectDialog(entry),
        color: 'error',
      },
    ],
  }));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Time Entry Approval
        </Typography>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={isLoading}
          fullWidth={isMobile}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Pending Approval: <strong>{unapprovedEntries.length}</strong>
        </Typography>
      </Card>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : unapprovedEntries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No time entries pending approval
          </Typography>
        </Paper>
      ) : isMobile ? (
        <MobileListView items={mobileListItems} loading={isLoading} />
      ) : (
        <Card>
          <DataGrid
            rows={unapprovedEntries}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
          />
        </Card>
      )}

      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Time Entry</DialogTitle>
        <DialogContent>
          {selectedEntry && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Employee: {selectedEntry.employee.firstName} {selectedEntry.employee.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Project: {selectedEntry.project.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Hours: {selectedEntry.hoursWorked} hrs
              </Typography>

              <TextField
                label="Reason for Rejection"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                multiline
                rows={4}
                fullWidth
                required
                autoFocus
                placeholder="Please provide a clear reason for rejection..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectReason.trim() || isLoading}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimeApproval;

