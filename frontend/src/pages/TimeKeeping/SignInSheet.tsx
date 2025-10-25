import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  AccessTime,
  PersonAdd,
  Logout as LogoutIcon,
  Refresh,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSignInStore } from '../../store/signin.store';
import { useEmployeeStore } from '../../store/employee.store';
import { useProjectStore } from '../../store/project.store';
import { useNotification } from '../../hooks/useNotification';
import { formatDate, formatTime } from '../../utils/formatters';
import { useMobileView } from '../../hooks/useResponsive';

const SignInSheet: React.FC = () => {
  const isMobile = useMobileView();
  const { showSuccess, showError } = useNotification();

  // Store state
  const {
    signIns,
    activeSignIns,
    selectedDate,
    isLoading,
    error,
    fetchSignInsForDate,
    bulkSignIn,
    signOut,
    setSelectedDate,
    clearError,
  } = useSignInStore();

  const { employees, fetchEmployees } = useEmployeeStore();
  const { projects, fetchProjects } = useProjectStore();

  // Local state
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);
  const [signInTime, setSignInTime] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [signOutTarget, setSignOutTarget] = useState<any>(null);
  const [signOutTime, setSignOutTime] = useState<Date>(new Date());
  const [datePickerValue, setDatePickerValue] = useState<Date>(new Date());

  // Load data on mount
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
    fetchSignInsForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh sign-ins when date changes
  useEffect(() => {
    fetchSignInsForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setDatePickerValue(date);
      const dateStr = date.toISOString().split('T')[0];
      setSelectedDate(dateStr);
    }
  };

  // Open sign-in dialog
  const handleOpenSignInDialog = () => {
    setSelectedEmployees([]);
    setSignInTime(new Date());
    setLocation('');
    setSelectedProject(null);
    setNotes('');
    setSignInDialogOpen(true);
  };

  // Handle bulk sign-in
  const handleBulkSignIn = async () => {
    if (selectedEmployees.length === 0) {
      showError('Please select at least one employee');
      return;
    }

    try {
      const result = await bulkSignIn({
        employeeIds: selectedEmployees.map((e) => e.id),
        date: selectedDate,
        signInTime: signInTime.toISOString(),
        location: location || undefined,
        projectId: selectedProject?.id || undefined,
        notes: notes || undefined,
      });

      showSuccess(
        `${result.signedIn.length} employee(s) signed in successfully`
      );

      if (result.alreadySignedIn.length > 0) {
        showError(
          `${result.alreadySignedIn.length} employee(s) were already signed in`
        );
      }

      setSignInDialogOpen(false);
      fetchSignInsForDate(selectedDate);
    } catch (error: any) {
      showError(error?.message || 'Failed to sign in employees');
    }
  };

  // Open sign-out dialog
  const handleOpenSignOutDialog = (signIn: any) => {
    setSignOutTarget(signIn);
    setSignOutTime(new Date());
    setSignOutDialogOpen(true);
  };

  // Handle sign-out
  const handleSignOut = async () => {
    if (!signOutTarget) return;

    try {
      await signOut(signOutTarget.id, signOutTime.toISOString());
      showSuccess(`${signOutTarget.employee.firstName} ${signOutTarget.employee.lastName} signed out`);
      setSignOutDialogOpen(false);
      setSignOutTarget(null);
      fetchSignInsForDate(selectedDate);
    } catch (error: any) {
      showError(error?.message || 'Failed to sign out employee');
    }
  };

  // Refresh data
  const handleRefresh = () => {
    fetchSignInsForDate(selectedDate);
  };

  // Get employee initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Filter active employees
  const activeEmployees = employees.filter((e) => e.isActive);

  // Signed in count
  const signedInCount = signIns.length;
  const activeCount = activeSignIns.length;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, margin: '0 auto' }}>
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
            Sign-In Sheet
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
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={isLoading}
              fullWidth={isMobile}
            >
              Refresh
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Signed In Today
              </Typography>
              <Typography variant="h3">{signedInCount}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Currently Active
              </Typography>
              <Typography variant="h3" color="success.main">
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Sign In Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<PersonAdd />}
          onClick={handleOpenSignInDialog}
          fullWidth
          sx={{
            mb: 3,
            minHeight: { xs: 56, sm: 48 },
            fontSize: { xs: '1.1rem', sm: '1rem' },
          }}
        >
          Sign In Employees
        </Button>

        {/* Signed In Employees List */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Signed In Employees
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : signIns.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No employees signed in for this date
                </Typography>
              </Box>
            ) : (
              <List>
                {signIns.map((signIn, index) => (
                  <React.Fragment key={signIn.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        !signIn.signOutTime && (
                          <Button
                            variant="contained"
                            color="error"
                            size={isMobile ? 'large' : 'medium'}
                            startIcon={<LogoutIcon />}
                            onClick={() => handleOpenSignOutDialog(signIn)}
                            sx={{ minHeight: { xs: 48, sm: 36 } }}
                          >
                            Sign Out
                          </Button>
                        )
                      }
                      sx={{ py: 2 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getInitials(
                            signIn.employee.firstName,
                            signIn.employee.lastName
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1">
                              {signIn.employee.firstName} {signIn.employee.lastName}
                            </Typography>
                            {signIn.signOutTime ? (
                              <Chip
                                label="Signed Out"
                                size="small"
                                color="default"
                              />
                            ) : (
                              <Chip
                                label="Active"
                                size="small"
                                color="success"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {signIn.employee.classification}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTime fontSize="small" />
                                <Typography variant="body2">
                                  In: {formatTime(signIn.signInTime)}
                                </Typography>
                              </Box>
                              {signIn.signOutTime && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AccessTime fontSize="small" />
                                  <Typography variant="body2">
                                    Out: {formatTime(signIn.signOutTime)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            {signIn.location && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOn fontSize="small" />
                                <Typography variant="body2">{signIn.location}</Typography>
                              </Box>
                            )}
                            {signIn.project && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Business fontSize="small" />
                                <Typography variant="body2">{signIn.project.name}</Typography>
                              </Box>
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        {/* Sign In Dialog */}
        <Dialog
          open={signInDialogOpen}
          onClose={() => setSignInDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Sign In Employees</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Autocomplete
                multiple
                options={activeEmployees}
                getOptionLabel={(option) =>
                  `${option.firstName} ${option.lastName} - ${option.classification}`
                }
                value={selectedEmployees}
                onChange={(_, newValue) => setSelectedEmployees(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Employees"
                    placeholder="Search employees..."
                  />
                )}
              />

              <TimePicker
                label="Sign In Time"
                value={signInTime}
                onChange={(newValue) => newValue && setSignInTime(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />

              <TextField
                label="Location (Optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Job site address or name"
                fullWidth
              />

              <Autocomplete
                options={projects}
                getOptionLabel={(option) => `${option.projectNumber} - ${option.name}`}
                value={selectedProject}
                onChange={(_, newValue) => setSelectedProject(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Project (Optional)" />
                )}
              />

              <TextField
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSignInDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleBulkSignIn}
              disabled={isLoading || selectedEmployees.length === 0}
            >
              Sign In ({selectedEmployees.length})
            </Button>
          </DialogActions>
        </Dialog>

        {/* Sign Out Dialog */}
        <Dialog
          open={signOutDialogOpen}
          onClose={() => setSignOutDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Sign Out</DialogTitle>
          <DialogContent>
            {signOutTarget && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Typography>
                  Sign out {signOutTarget.employee.firstName}{' '}
                  {signOutTarget.employee.lastName}?
                </Typography>

                <TimePicker
                  label="Sign Out Time"
                  value={signOutTime}
                  onChange={(newValue) => newValue && setSignOutTime(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSignOutDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              Sign Out
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default SignInSheet;

