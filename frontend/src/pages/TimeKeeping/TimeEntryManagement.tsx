import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Alert,
  Stack,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Add,
  Download,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Check,
  Close,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useTimeEntryStore } from '../../store/timeentry.store';
import { useEmployeeStore } from '../../store/employee.store';
import { useProjectStore } from '../../store/project.store';
import { usePayrollStore } from '../../store/payroll.store';
import { useNotification } from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useMobileView } from '../../hooks/useResponsive';
import { MobileListView, MobileListItem } from '../../components/common';
import { ConfirmDialog } from '../../components/common';
import { TimeEntryFormData } from '../../types/timekeeping.types';

const TimeEntryManagement: React.FC = () => {
  const isMobile = useMobileView();
  const { showSuccess, showError } = useNotification();

  // Stores
  const {
    timeEntries,
    selectedDate,
    isLoading,
    error,
    fetchTimeEntriesForDate,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    setSelectedDate,
    clearError,
  } = useTimeEntryStore();

  const { employees, fetchEmployees } = useEmployeeStore();
  const { projects, fetchProjects } = useProjectStore();
  const { downloadDailyCSV, downloadWeeklyCSV } = usePayrollStore();

  // Local state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [entryToDelete, setEntryToDelete] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<TimeEntryFormData>({
    employeeId: '',
    date: '',
    projectId: '',
    hoursWorked: 8,
    workType: 'Regular',
    description: '',
    taskPerformed: '',
  });

  // Filter state
  const [employeeFilter, setEmployeeFilter] = useState<any>(null);
  const [projectFilter, setProjectFilter] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Load data
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
    fetchTimeEntriesForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTimeEntriesForDate(selectedDate, {
      employeeId: employeeFilter?.id,
      projectId: projectFilter?.id,
      status: statusFilter || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, employeeFilter, projectFilter, statusFilter]);

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setDatePickerValue(date);
      const dateStr = date.toISOString().split('T')[0];
      setSelectedDate(dateStr);
    }
  };

  // Open form dialog
  const handleOpenForm = (entry?: any) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        employeeId: entry.employeeId,
        date: entry.date,
        projectId: entry.projectId,
        hoursWorked: entry.hoursWorked,
        workType: entry.workType || 'Regular',
        description: entry.description || '',
        taskPerformed: entry.taskPerformed || '',
      });
    } else {
      setEditingEntry(null);
      setFormData({
        employeeId: '',
        date: selectedDate,
        projectId: '',
        hoursWorked: 8,
        workType: 'Regular',
        description: '',
        taskPerformed: '',
      });
    }
    setFormDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      if (editingEntry) {
        await updateTimeEntry(editingEntry.id, formData);
        showSuccess('Time entry updated successfully');
      } else {
        await createTimeEntry(formData);
        showSuccess('Time entry created successfully');
      }
      setFormDialogOpen(false);
      fetchTimeEntriesForDate(selectedDate);
    } catch (error: any) {
      showError(error?.message || 'Failed to save time entry');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      await deleteTimeEntry(entryToDelete.id);
      showSuccess('Time entry deleted successfully');
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      fetchTimeEntriesForDate(selectedDate);
    } catch (error: any) {
      showError(error?.message || 'Failed to delete time entry');
    }
  };

  // Export daily CSV
  const handleExportDaily = async () => {
    try {
      await downloadDailyCSV(selectedDate);
      showSuccess('Daily report exported successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to export daily report');
    }
    setExportMenuAnchor(null);
  };

  // Export weekly CSV
  const handleExportWeekly = async () => {
    // Calculate week start (Monday) and end (Sunday)
    const date = new Date(selectedDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    try {
      await downloadWeeklyCSV(startStr, endStr);
      showSuccess('Weekly report exported successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to export weekly report');
    }
    setExportMenuAnchor(null);
  };

  // Calculate totals
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const uniqueEmployees = new Set(timeEntries.map(e => e.employeeId)).size;
  const uniqueProjects = new Set(timeEntries.map(e => e.projectId)).size;

  // DataGrid columns
  const columns: GridColDef[] = [
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
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'APPROVED'
              ? 'success'
              : params.value === 'REJECTED'
              ? 'error'
              : 'warning'
          }
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="small"
            onClick={() => handleOpenForm(params.row)}
          >
            <Edit fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => {
              setEntryToDelete(params.row);
              setDeleteDialogOpen(true);
            }}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  // Mobile list items
  const mobileListItems: MobileListItem[] = timeEntries.map((entry) => ({
    id: entry.id,
    title: `${entry.employee.firstName} ${entry.employee.lastName}`,
    subtitle: entry.project.name,
    description: entry.taskPerformed || entry.description || 'No description',
    status: {
      label: entry.status,
      color:
        entry.status === 'APPROVED'
          ? 'success'
          : entry.status === 'REJECTED'
          ? 'error'
          : 'warning',
    },
    metadata: [
      { label: 'Hours', value: `${entry.hoursWorked} hrs` },
      { label: 'Type', value: entry.workType || 'Regular' },
    ],
    actions: [
      {
        label: 'Edit',
        onClick: () => handleOpenForm(entry),
        color: 'primary',
      },
      {
        label: 'Delete',
        onClick: () => {
          setEntryToDelete(entry);
          setDeleteDialogOpen(true);
        },
        color: 'error',
      },
    ],
    onClick: () => handleOpenForm(entry),
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
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
            Time Entry Management
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <DatePicker
              label="Date"
              value={datePickerValue}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: isMobile,
                },
              }}
            />
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              fullWidth={isMobile}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Hours
              </Typography>
              <Typography variant="h4">{totalHours.toFixed(2)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Employees
              </Typography>
              <Typography variant="h4">{uniqueEmployees}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Projects
              </Typography>
              <Typography variant="h4">{uniqueProjects}</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Actions */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenForm()}
            fullWidth={isMobile}
          >
            Add Time Entry
          </Button>

          <Autocomplete
            options={employees}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            value={employeeFilter}
            onChange={(_, newValue) => setEmployeeFilter(newValue)}
            renderInput={(params) => <TextField {...params} label="Filter by Employee" size="small" />}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          />

          <Autocomplete
            options={projects}
            getOptionLabel={(option) => option.name}
            value={projectFilter}
            onChange={(_, newValue) => setProjectFilter(newValue)}
            renderInput={(params) => <TextField {...params} label="Filter by Project" size="small" />}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          />
        </Box>

        {/* Time Entries Table/List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : timeEntries.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No time entries for this date
            </Typography>
          </Paper>
        ) : isMobile ? (
          <MobileListView
            items={mobileListItems}
            loading={isLoading}
          />
        ) : (
          <Card>
            <DataGrid
              rows={timeEntries}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              autoHeight
            />
          </Card>
        )}

        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={() => setExportMenuAnchor(null)}
        >
          <MenuItem onClick={handleExportDaily}>Export Daily (Selected Date)</MenuItem>
          <MenuItem onClick={handleExportWeekly}>Export Weekly (Current Week)</MenuItem>
        </Menu>

        {/* Form Dialog */}
        <Dialog
          open={formDialogOpen}
          onClose={() => setFormDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            {editingEntry ? 'Edit Time Entry' : 'Add Time Entry'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Autocomplete
                options={employees}
                getOptionLabel={(option) =>
                  `${option.firstName} ${option.lastName} - ${option.classification}`
                }
                value={employees.find((e) => e.id === formData.employeeId) || null}
                onChange={(_, newValue) =>
                  setFormData({ ...formData, employeeId: newValue?.id || '' })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Employee" required />
                )}
              />

              <Autocomplete
                options={projects}
                getOptionLabel={(option) => `${option.projectNumber} - ${option.name}`}
                value={projects.find((p) => p.id === formData.projectId) || null}
                onChange={(_, newValue) =>
                  setFormData({ ...formData, projectId: newValue?.id || '' })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Project" required />
                )}
              />

              <TextField
                label="Hours Worked"
                type="number"
                value={formData.hoursWorked}
                onChange={(e) =>
                  setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) })
                }
                inputProps={{ min: 0, max: 24, step: 0.5 }}
                required
                fullWidth
              />

              <TextField
                label="Work Type"
                select
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value as any })}
                fullWidth
              >
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Overtime">Overtime</MenuItem>
                <MenuItem value="Double Time">Double Time</MenuItem>
              </TextField>

              <TextField
                label="Task Performed"
                value={formData.taskPerformed}
                onChange={(e) => setFormData({ ...formData, taskPerformed: e.target.value })}
                fullWidth
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!formData.employeeId || !formData.projectId || isLoading}
            >
              {editingEntry ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Time Entry"
          description={
            entryToDelete
              ? `Are you sure you want to delete this time entry for ${entryToDelete.employee.firstName} ${entryToDelete.employee.lastName}?`
              : ''
          }
          onConfirm={handleDelete}
          onClose={() => {
            setDeleteDialogOpen(false);
            setEntryToDelete(null);
          }}
          confirmText="Delete"
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TimeEntryManagement;

