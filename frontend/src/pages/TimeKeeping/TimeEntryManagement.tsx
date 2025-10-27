import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Autocomplete,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Description,
  PictureAsPdf,
  Warning,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTimesheetStore } from '../../store/timesheet.store';
import { useEmployeeStore } from '../../store/employee.store';
import { useProjectStore } from '../../store/project.store';
import { useNotification } from '../../hooks/useNotification';
import { TimeEntry } from '../../services/timesheet.service';

interface TimeEntryRow {
  tempId: string;
  employeeId: string;
  projectId: string;
  hoursWorked: number;
  workType: string;
  description: string;
  taskPerformed: string;
}

const TimeEntryManagement: React.FC = () => {
  const { success: showSuccess, error: showError } = useNotification();

  // Stores
  const {
    timesheets,
    currentTimesheet,
    isLoading,
    fetchTimesheetsForDate,
    fetchTimesheetById,
    createTimesheet,
    updateTimesheet,
    clearCurrentTimesheet,
    exportToPDF,
  } = useTimesheetStore();

  const { employees, fetchEmployees } = useEmployeeStore();
  const { projects, fetchProjects } = useProjectStore();

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());
  const [showNewTimesheetForm, setShowNewTimesheetForm] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [timeEntryRows, setTimeEntryRows] = useState<TimeEntryRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timesheetToDelete, setTimesheetToDelete] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
  }, [fetchEmployees, fetchProjects]);

  // Load timesheets when date changes
  useEffect(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    fetchTimesheetsForDate(dateStr);
  }, [selectedDate, fetchTimesheetsForDate]);

  // Handle date change
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setDatePickerValue(newDate);
      setSelectedDate(newDate);
      setShowNewTimesheetForm(false);
      setTimeEntryRows([]);
      setSelectedEmployees([]);
      setTitle('');
      setNotes('');
      clearCurrentTimesheet();
    }
  };

  // Initialize form for new timesheet
  const handleCreateNew = () => {
    setShowNewTimesheetForm(true);
    setTimeEntryRows([]);
    setSelectedEmployees([]);
    setTitle('');
    setNotes('');
    clearCurrentTimesheet();
  };

  // Add employee rows when employees are selected
  useEffect(() => {
    if (showNewTimesheetForm && selectedEmployees.length > 0) {
      // Add rows for newly selected employees
      const existingEmployeeIds = timeEntryRows.map((r) => r.employeeId);
      const newEmployees = selectedEmployees.filter(
        (emp) => !existingEmployeeIds.includes(emp.id)
      );

      if (newEmployees.length > 0) {
        const newRows: TimeEntryRow[] = newEmployees.map((emp) => ({
          tempId: `new-${Date.now()}-${Math.random()}`,
          employeeId: emp.id,
          projectId: '',
          hoursWorked: 8,
          workType: 'Regular',
          description: '',
          taskPerformed: '',
        }));
        setTimeEntryRows([...timeEntryRows, ...newRows]);
      }

      // Remove rows for deselected employees
      const selectedIds = selectedEmployees.map((e) => e.id);
      setTimeEntryRows((rows) => rows.filter((r) => selectedIds.includes(r.employeeId)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployees, showNewTimesheetForm]);

  // Add a new row for an employee
  const handleAddRow = (employeeId: string) => {
    const newRow: TimeEntryRow = {
      tempId: `new-${Date.now()}-${Math.random()}`,
      employeeId,
      projectId: '',
      hoursWorked: 0,
      workType: 'Regular',
      description: '',
      taskPerformed: '',
    };
    setTimeEntryRows([...timeEntryRows, newRow]);
  };

  // Delete a row
  const handleDeleteRow = (tempId: string) => {
    setTimeEntryRows(timeEntryRows.filter((r) => r.tempId !== tempId));
  };

  // Update row field
  const handleUpdateRow = (tempId: string, field: keyof TimeEntryRow, value: any) => {
    setTimeEntryRows(
      timeEntryRows.map((r) =>
        r.tempId === tempId ? { ...r, [field]: value } : r
      )
    );
  };

  // Save timesheet
  const handleSave = async () => {
    // Validation
    if (timeEntryRows.length === 0) {
      showError('Please add at least one time entry');
      return;
    }

    const invalidRows = timeEntryRows.filter(
      (r) => !r.projectId || r.hoursWorked <= 0
    );

    if (invalidRows.length > 0) {
      showError('All rows must have a project and hours worked greater than 0');
      return;
    }

    setIsSaving(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      const timeEntries: TimeEntry[] = timeEntryRows.map((row) => ({
        employeeId: row.employeeId,
        projectId: row.projectId,
        hoursWorked: row.hoursWorked,
        workType: row.workType,
        description: row.description,
        taskPerformed: row.taskPerformed,
      }));

      const timesheetData = {
        date: dateStr,
        title: title || `Timesheet for ${dateStr}`,
        notes,
        employeeIds: selectedEmployees.map((e) => e.id),
        timeEntries,
      };

      if (currentTimesheet) {
        // Update existing
        await updateTimesheet(currentTimesheet.id, {
          title: title || `Timesheet for ${dateStr}`,
          notes,
          timeEntries,
        });
        showSuccess('Timesheet updated successfully');
      } else {
        // Create new
        await createTimesheet(timesheetData);
        showSuccess('Timesheet created successfully');
      }

      // Reload timesheets
      await fetchTimesheetsForDate(dateStr);

      // Reset form
      setShowNewTimesheetForm(false);
      setTimeEntryRows([]);
      setSelectedEmployees([]);
      setTitle('');
      setNotes('');
      clearCurrentTimesheet(); // Clear the current timesheet reference
    } catch (error: any) {
      showError(error?.message || 'Failed to save timesheet');
    } finally {
      setIsSaving(false);
    }
  };

  // Load timesheet for editing
  const handleEditTimesheet = async (timesheet: any) => {
    // Load the full timesheet into currentTimesheet state
    await fetchTimesheetById(timesheet.id);
    
    setShowNewTimesheetForm(true);
    setTitle(timesheet.title || '');
    setNotes(timesheet.notes || '');

    // Build employee list from time entries
    const employeeIds = Array.from(
      new Set(timesheet.timeEntries.map((e: any) => e.employeeId))
    );
    const selectedEmps = (employees || []).filter((emp: any) =>
      employeeIds.includes(emp.id)
    );
    setSelectedEmployees(selectedEmps);

    // Build rows from time entries
    const rows: TimeEntryRow[] = timesheet.timeEntries.map((entry: any) => ({
      tempId: entry.id || `temp-${Date.now()}-${Math.random()}`,
      employeeId: entry.employeeId,
      projectId: entry.projectId,
      hoursWorked: entry.hoursWorked,
      workType: entry.workType || 'Regular',
      description: entry.description || '',
      taskPerformed: entry.taskPerformed || '',
    }));

    setTimeEntryRows(rows);
  };

  // View timesheet details
  const handleViewTimesheet = async (timesheetToView: any) => {
    try {
      // Fetch full timesheet details if needed
      const fullTimesheet = await useTimesheetStore.getState().fetchTimesheetById(timesheetToView.id);
      setViewDialogOpen(true);
    } catch (error: any) {
      showError('Failed to load timesheet details');
    }
  };

  // Export to PDF
  const handleExportPDF = async (timesheetId: string) => {
    try {
      await exportToPDF(timesheetId);
      showSuccess('PDF exported successfully');
    } catch (error: any) {
      showError('Failed to export PDF');
    }
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (timesheet: any) => {
    setTimesheetToDelete(timesheet);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTimesheetToDelete(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!timesheetToDelete) return;

    try {
      const success = await useTimesheetStore.getState().deleteTimesheet(timesheetToDelete.id);
      if (success) {
        showSuccess('Timesheet deleted successfully');
        // Reload timesheets for the date
        await fetchTimesheetsForDate(selectedDate.toISOString().split('T')[0]);
      } else {
        showError('Failed to delete timesheet');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to delete timesheet');
    } finally {
      handleCloseDeleteDialog();
    }
  };

  // Group rows by employee
  const groupedRows = timeEntryRows.reduce((acc, row) => {
    if (!acc[row.employeeId]) {
      acc[row.employeeId] = [];
    }
    acc[row.employeeId].push(row);
    return acc;
  }, {} as Record<string, TimeEntryRow[]>);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Time Entry
          </Typography>
        </Stack>

        {/* Date Picker */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <DatePicker
            label="Select Date"
            value={datePickerValue}
            onChange={handleDateChange}
            slotProps={{
              textField: {
                fullWidth: false,
              },
            }}
          />

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateNew}
            disabled={showNewTimesheetForm}
          >
            Create New Timesheet
          </Button>
        </Stack>

        {/* Instructions */}
        {showNewTimesheetForm && (
          <Alert severity="info" sx={{ mb: 3 }}>
            1. Select employees for this timesheet
            <br />
            2. Enter project, hours, and other details for each employee
            <br />
            3. Use the "+ Add Row" button to add multiple projects for an employee
            <br />
            4. Click "Save Timesheet" when done
          </Alert>
        )}

        {/* New/Edit Timesheet Form */}
        {showNewTimesheetForm && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {currentTimesheet ? 'Edit Timesheet' : 'New Timesheet'}
            </Typography>

            <Stack spacing={2}>
              {/* Title */}
              <TextField
                label="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                placeholder={`Timesheet for ${selectedDate.toISOString().split('T')[0]}`}
              />

              {/* Notes */}
              <TextField
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Add any notes about this timesheet..."
              />

              {/* Employee Selection */}
              <Autocomplete
                multiple
                options={employees || []}
                value={selectedEmployees}
                onChange={(_, newValue) => setSelectedEmployees(newValue)}
                getOptionLabel={(option: any) =>
                  `${option.firstName} ${option.lastName} (${option.classification})`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Employees"
                    placeholder="Choose employees..."
                  />
                )}
                isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
              />

              {/* Time Entry Table */}
              {timeEntryRows.length > 0 && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Project</TableCell>
                        <TableCell width={100}>Hours</TableCell>
                        <TableCell width={120}>Work Type</TableCell>
                        <TableCell>Task/Description</TableCell>
                        <TableCell width={100}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(groupedRows).map(([employeeId, rows]) => {
                        const employee = (employees || []).find((e: any) => e.id === employeeId);
                        const employeeName = employee
                          ? `${employee.firstName} ${employee.lastName}`
                          : 'Unknown';

                        return (
                          <React.Fragment key={employeeId}>
                            {rows.map((row, idx) => {
                              const isFirst = idx === 0;
                              const isLast = idx === rows.length - 1;

                              return (
                                <TableRow
                                  key={row.tempId}
                                  sx={{
                                    borderTop: isFirst ? '3px solid' : undefined,
                                    borderTopColor: isFirst ? 'primary.main' : undefined,
                                    borderBottom: isLast ? '2px solid' : undefined,
                                    borderBottomColor: isLast ? 'divider' : undefined,
                                  }}
                                >
                                  {/* Employee Name (only on first row) */}
                                  <TableCell>
                                    {isFirst && (
                                      <Typography variant="body2" fontWeight={600}>
                                        {employeeName}
                                      </Typography>
                                    )}
                                  </TableCell>

                                  {/* Project */}
                                  <TableCell>
                                    <Autocomplete
                                      options={projects || []}
                                      value={
                                        (projects || []).find((p: any) => p.id === row.projectId) ||
                                        null
                                      }
                                      onChange={(_, newValue) =>
                                        handleUpdateRow(row.tempId, 'projectId', newValue?.id || '')
                                      }
                                      getOptionLabel={(option: any) =>
                                        `${option.name} (${option.projectNumber})`
                                      }
                                      renderInput={(params) => (
                                        <TextField {...params} size="small" required />
                                      )}
                                      isOptionEqualToValue={(option: any, value: any) =>
                                        option.id === value.id
                                      }
                                    />
                                  </TableCell>

                                  {/* Hours */}
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={row.hoursWorked}
                                      onChange={(e) =>
                                        handleUpdateRow(
                                          row.tempId,
                                          'hoursWorked',
                                          Number(e.target.value)
                                        )
                                      }
                                      size="small"
                                      inputProps={{ min: 0, step: 0.5 }}
                                      required
                                    />
                                  </TableCell>

                                  {/* Work Type */}
                                  <TableCell>
                                    <TextField
                                      select
                                      value={row.workType}
                                      onChange={(e) =>
                                        handleUpdateRow(row.tempId, 'workType', e.target.value)
                                      }
                                      size="small"
                                      fullWidth
                                    >
                                      <MenuItem value="Regular">Regular</MenuItem>
                                      <MenuItem value="Overtime">Overtime</MenuItem>
                                      <MenuItem value="Double Time">Double Time</MenuItem>
                                    </TextField>
                                  </TableCell>

                                  {/* Task/Description */}
                                  <TableCell>
                                    <TextField
                                      value={row.description}
                                      onChange={(e) =>
                                        handleUpdateRow(row.tempId, 'description', e.target.value)
                                      }
                                      size="small"
                                      placeholder="Task description..."
                                      fullWidth
                                    />
                                  </TableCell>

                                  {/* Actions */}
                                  <TableCell>
                                    <Stack direction="row" spacing={0.5}>
                                      {isLast && (
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleAddRow(employeeId)}
                                          title="Add another project for this employee"
                                        >
                                          <Add fontSize="small" />
                                        </IconButton>
                                      )}
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteRow(row.tempId)}
                                        title="Delete this row"
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowNewTimesheetForm(false);
                    setTimeEntryRows([]);
                    setSelectedEmployees([]);
                    setTitle('');
                    setNotes('');
                    clearCurrentTimesheet();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={isSaving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Timesheet'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Existing Timesheets */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Timesheets for {selectedDate.toLocaleDateString()}
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : timesheets.length === 0 ? (
          <Alert severity="info">No timesheets found for this date</Alert>
        ) : (
          <Stack spacing={2}>
            {timesheets.map((timesheet: any) => (
              <Paper key={timesheet.id} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{timesheet.title || 'Untitled Timesheet'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: <Chip label={timesheet.status} size="small" color={
                        timesheet.status === 'DRAFT' ? 'default' :
                        timesheet.status === 'SUBMITTED' ? 'warning' : 'success'
                      } />
                      {' | '}
                      Entries: {timesheet.entryCount || timesheet.timeEntries?.length || 0}
                      {' | '}
                      Created by: {timesheet.createdByUser?.firstName} {timesheet.createdByUser?.lastName}
                    </Typography>
                    {timesheet.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {timesheet.notes}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Description />}
                      onClick={() => handleViewTimesheet(timesheet)}
                    >
                      View
                    </Button>
                    {timesheet.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEditTimesheet(timesheet)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<Delete />}
                          onClick={() => handleOpenDeleteDialog(timesheet)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PictureAsPdf />}
                      onClick={() => handleExportPDF(timesheet.id)}
                    >
                      PDF
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">
                  {currentTimesheet?.title || 'Timesheet Details'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTimesheet?.date && new Date(currentTimesheet.date).toLocaleDateString()} | Status:{' '}
                  <Chip
                    label={currentTimesheet?.status}
                    size="small"
                    color={
                      currentTimesheet?.status === 'DRAFT'
                        ? 'default'
                        : currentTimesheet?.status === 'SUBMITTED'
                        ? 'warning'
                        : 'success'
                    }
                  />
                </Typography>
              </Box>
              <IconButton onClick={() => handleExportPDF(currentTimesheet?.id || '')}>
                <PictureAsPdf />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {currentTimesheet?.notes && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Notes:</strong> {currentTimesheet.notes}
              </Alert>
            )}

            {currentTimesheet?.timeEntries && currentTimesheet.timeEntries.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Project</TableCell>
                      <TableCell align="right">Hours</TableCell>
                      <TableCell>Work Type</TableCell>
                      <TableCell>Task/Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      // Classification hierarchy for sorting
                      const classificationOrder: Record<string, number> = {
                        'SUPERVISOR': 1,
                        'PROJECT_MANAGER': 2,
                        'GENERAL_FOREMAN': 3,
                        'FOREMAN': 4,
                        'JOURNEYMAN': 5,
                        'APPRENTICE': 6,
                      };

                      const getClassificationOrder = (classification: string): number => {
                        return classificationOrder[classification?.toUpperCase()] || 999;
                      };

                      // Group entries by employee
                      const grouped = (currentTimesheet.timeEntries || []).reduce((acc: any, entry: any) => {
                        const empId = entry.employeeId;
                        if (!acc[empId]) {
                          acc[empId] = {
                            employee: entry.employee,
                            entries: [],
                            total: 0,
                          };
                        }
                        acc[empId].entries.push(entry);
                        acc[empId].total += entry.hoursWorked;
                        return acc;
                      }, {});

                      // Sort employees by classification
                      const sortedGroups = Object.values(grouped).sort((a: any, b: any) => {
                        const classA = a.employee?.classification || '';
                        const classB = b.employee?.classification || '';
                        return getClassificationOrder(classA) - getClassificationOrder(classB);
                      });

                      let grandTotal = 0;

                      return (
                        <>
                          {sortedGroups.map((group: any, groupIdx: number) => (
                            <React.Fragment key={groupIdx}>
                              {group.entries.map((entry: any, entryIdx: number) => {
                                const isFirst = entryIdx === 0;
                                const isLast = entryIdx === group.entries.length - 1;

                                if (isLast) {
                                  grandTotal += group.total;
                                }

                                return (
                                  <TableRow
                                    key={entry.id}
                                    sx={{
                                      borderTop: isFirst ? '2px solid' : undefined,
                                      borderTopColor: isFirst ? 'primary.main' : undefined,
                                    }}
                                  >
                                    <TableCell>
                                      {isFirst && (
                                        <Typography variant="body2" fontWeight={600}>
                                          {group.employee?.firstName} {group.employee?.lastName}
                                          <br />
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            component="span"
                                          >
                                            {group.employee?.classification}
                                          </Typography>
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">
                                        {entry.project?.name}
                                        <br />
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          component="span"
                                        >
                                          {entry.project?.projectNumber}
                                        </Typography>
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <strong>{entry.hoursWorked}h</strong>
                                    </TableCell>
                                    <TableCell>
                                      <Chip label={entry.workType} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                      {entry.taskPerformed || entry.description || '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {/* Employee subtotal */}
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell colSpan={2} align="right">
                                  <Typography variant="body2" fontWeight={600}>
                                    {group.employee?.firstName} {group.employee?.lastName} Total:
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight={600}>
                                    {group.total.toFixed(2)}h
                                  </Typography>
                                </TableCell>
                                <TableCell colSpan={2} />
                              </TableRow>
                            </React.Fragment>
                          ))}
                          {/* Grand total */}
                          <TableRow sx={{ bgcolor: 'primary.main', color: 'white' }}>
                            <TableCell colSpan={2} align="right" sx={{ color: 'white' }}>
                              <Typography variant="body1" fontWeight={700}>
                                Grand Total:
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'white' }}>
                              <Typography variant="body1" fontWeight={700}>
                                {grandTotal.toFixed(2)}h
                              </Typography>
                            </TableCell>
                            <TableCell colSpan={2} sx={{ color: 'white' }} />
                          </TableRow>
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No time entries in this timesheet</Alert>
            )}

            {currentTimesheet?.createdByUser && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Created by {currentTimesheet.createdByUser.firstName}{' '}
                {currentTimesheet.createdByUser.lastName} on{' '}
                {new Date(currentTimesheet.createdAt).toLocaleString()}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<PictureAsPdf />}
              onClick={() => handleExportPDF(currentTimesheet?.id || '')}
            >
              Export PDF
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <Warning color="error" />
              <Typography variant="h6">Delete Timesheet?</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone!
            </Alert>
            <Typography>
              Are you sure you want to delete this timesheet?
            </Typography>
            {timesheetToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Title:</strong> {timesheetToDelete.title || 'Untitled Timesheet'}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong>{' '}
                  {new Date(timesheetToDelete.date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Entries:</strong>{' '}
                  {timesheetToDelete.entryCount || timesheetToDelete.timeEntries?.length || 0}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={handleConfirmDelete}
            >
              Delete Timesheet
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TimeEntryManagement;
