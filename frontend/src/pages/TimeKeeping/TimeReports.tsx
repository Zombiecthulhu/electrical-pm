import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assessment,
  CalendarToday,
  Person,
  Work,
  Download,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import { useTimeEntryStore } from '../../store/timeentry.store';
import { useEmployeeStore } from '../../store/employee.store';
import { useProjectStore } from '../../store/project.store';
import { useNotification } from '../../hooks/useNotification';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const TimeReports: React.FC = () => {
  const { success: showSuccess, error: showError } = useNotification();

  const { timeEntries, fetchTimeEntriesForDate, isLoading } = useTimeEntryStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const { projects, fetchProjects } = useProjectStore();

  const [reportType, setReportType] = useState<'day' | 'week'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState(0);

  // Load data
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
  }, [fetchEmployees, fetchProjects]);

  // Load time entries when date changes
  useEffect(() => {
    if (reportType === 'day') {
      const dateStr = selectedDate.toISOString().split('T')[0];
      fetchTimeEntriesForDate(dateStr);
    } else {
      // For week, load all days
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
      const promises = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(start, i);
        const dateStr = day.toISOString().split('T')[0];
        promises.push(fetchTimeEntriesForDate(dateStr));
      }
      Promise.all(promises);
    }
  }, [selectedDate, reportType, fetchTimeEntriesForDate]);

  // Calculate summaries
  const summary = React.useMemo(() => {
    const entries = timeEntries || [];
    
    let totalHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;
    const employeeCounts = new Set();
    const projectCounts = new Set();

    entries.forEach((entry: any) => {
      totalHours += entry.hoursWorked;
      if (entry.workType === 'Overtime') {
        overtimeHours += entry.hoursWorked;
      } else if (entry.workType === 'Double Time') {
        overtimeHours += entry.hoursWorked * 2;
      } else {
        regularHours += entry.hoursWorked;
      }
      employeeCounts.add(entry.employeeId);
      projectCounts.add(entry.projectId);
    });

    return {
      totalHours: totalHours.toFixed(2),
      regularHours: regularHours.toFixed(2),
      overtimeHours: overtimeHours.toFixed(2),
      employeeCount: employeeCounts.size,
      projectCount: projectCounts.size,
      entryCount: entries.length,
    };
  }, [timeEntries]);

  // Group by employee
  const employeeReport = React.useMemo(() => {
    const entries = timeEntries || [];
    const grouped: Record<string, any> = {};

    entries.forEach((entry: any) => {
      const empId = entry.employeeId;
      if (!grouped[empId]) {
        grouped[empId] = {
          employee: entry.employee,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          projects: new Set(),
          entries: [],
        };
      }
      grouped[empId].totalHours += entry.hoursWorked;
      if (entry.workType === 'Overtime') {
        grouped[empId].overtimeHours += entry.hoursWorked;
      } else if (entry.workType === 'Double Time') {
        grouped[empId].overtimeHours += entry.hoursWorked * 2;
      } else {
        grouped[empId].regularHours += entry.hoursWorked;
      }
      grouped[empId].projects.add(entry.project?.name);
      grouped[empId].entries.push(entry);
    });

    return Object.values(grouped).sort(
      (a: any, b: any) => b.totalHours - a.totalHours
    );
  }, [timeEntries]);

  // Group by project
  const projectReport = React.useMemo(() => {
    const entries = timeEntries || [];
    const grouped: Record<string, any> = {};

    entries.forEach((entry: any) => {
      const projId = entry.projectId;
      if (!grouped[projId]) {
        grouped[projId] = {
          project: entry.project,
          totalHours: 0,
          regularHours: 0,
          overtimeHours: 0,
          employees: new Set(),
          entries: [],
        };
      }
      grouped[projId].totalHours += entry.hoursWorked;
      if (entry.workType === 'Overtime') {
        grouped[projId].overtimeHours += entry.hoursWorked;
      } else if (entry.workType === 'Double Time') {
        grouped[projId].overtimeHours += entry.hoursWorked * 2;
      } else {
        grouped[projId].regularHours += entry.hoursWorked;
      }
      grouped[projId].employees.add(`${entry.employee?.firstName} ${entry.employee?.lastName}`);
      grouped[projId].entries.push(entry);
    });

    return Object.values(grouped).sort(
      (a: any, b: any) => b.totalHours - a.totalHours
    );
  }, [timeEntries]);

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  const getDateRangeText = () => {
    if (reportType === 'day') {
      return format(selectedDate, 'MMMM dd, yyyy (EEEE)');
    } else {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Time Reports
          </Typography>
        </Stack>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'day' | 'week')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="week">Weekly</MenuItem>
            </TextField>

            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={handleDateChange}
              slotProps={{
                textField: {
                  fullWidth: false,
                },
              }}
            />

            <Box sx={{ flexGrow: 1 }} />

            <Button variant="outlined" startIcon={<Download />}>
              Export
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Showing data for: <strong>{getDateRangeText()}</strong>
          </Typography>
        </Paper>

        {/* Summary Cards */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mb: 3,
            flexWrap: 'wrap',
            '& > *': { flex: '1 1 150px', minWidth: '150px' },
          }}
        >
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Hours
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.totalHours}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Regular
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main">
                {summary.regularHours}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Overtime
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {summary.overtimeHours}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Employees
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.employeeCount}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Projects
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.projectCount}
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Entries
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {summary.entryCount}
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Person />} iconPosition="start" label="By Employee" />
            <Tab icon={<Work />} iconPosition="start" label="By Project" />
            <Tab icon={<CalendarToday />} iconPosition="start" label="Detailed View" />
          </Tabs>
        </Box>

        {/* By Employee Report */}
        <TabPanel value={activeTab} index={0}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : employeeReport.length === 0 ? (
            <Alert severity="info">No time entries found for this period</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Classification</TableCell>
                    <TableCell align="right">Total Hours</TableCell>
                    <TableCell align="right">Regular</TableCell>
                    <TableCell align="right">Overtime</TableCell>
                    <TableCell>Projects</TableCell>
                    <TableCell align="center">Entries</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employeeReport.map((emp: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {emp.employee?.firstName} {emp.employee?.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={emp.employee?.classification} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>
                          {emp.totalHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {emp.regularHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main">
                          {emp.overtimeHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {Array.from(emp.projects).slice(0, 2).join(', ')}
                          {emp.projects.size > 2 && ` +${emp.projects.size - 2} more`}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{emp.entries.length}</TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="body1" fontWeight={700}>
                        Total
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={700}>
                        {summary.totalHours}h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={700} color="success.main">
                        {summary.regularHours}h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={700} color="warning.main">
                        {summary.overtimeHours}h
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* By Project Report */}
        <TabPanel value={activeTab} index={1}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : projectReport.length === 0 ? (
            <Alert severity="info">No time entries found for this period</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell>Project Number</TableCell>
                    <TableCell align="right">Total Hours</TableCell>
                    <TableCell align="right">Regular</TableCell>
                    <TableCell align="right">Overtime</TableCell>
                    <TableCell>Employees</TableCell>
                    <TableCell align="center">Entries</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectReport.map((proj: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {proj.project?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={proj.project?.projectNumber} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>
                          {proj.totalHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {proj.regularHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="warning.main">
                          {proj.overtimeHours.toFixed(2)}h
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {Array.from(proj.employees).slice(0, 2).join(', ')}
                          {proj.employees.size > 2 && ` +${proj.employees.size - 2} more`}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{proj.entries.length}</TableCell>
                    </TableRow>
                  ))}
                  {/* Total row */}
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell colSpan={2}>
                      <Typography variant="body1" fontWeight={700}>
                        Total
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={700}>
                        {summary.totalHours}h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={700} color="success.main">
                        {summary.regularHours}h
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={700} color="warning.main">
                        {summary.overtimeHours}h
                      </Typography>
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Detailed View */}
        <TabPanel value={activeTab} index={2}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (timeEntries || []).length === 0 ? (
            <Alert severity="info">No time entries found for this period</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Hours</TableCell>
                    <TableCell>Work Type</TableCell>
                    <TableCell>Task</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(timeEntries || []).map((entry: any) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {entry.employee?.firstName} {entry.employee?.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.project?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.project?.projectNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <strong>{entry.hoursWorked}h</strong>
                      </TableCell>
                      <TableCell>
                        <Chip label={entry.workType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                          {entry.taskPerformed || entry.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          size="small"
                          color={
                            entry.status === 'APPROVED'
                              ? 'success'
                              : entry.status === 'PENDING'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Box>
    </LocalizationProvider>
  );
};

export default TimeReports;

