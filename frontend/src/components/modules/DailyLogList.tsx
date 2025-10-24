/**
 * Daily Log List Component
 * 
 * Displays a list of daily logs with filtering, search, and CRUD operations
 * using Material-UI DataGrid for construction daily reports.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridActionsCellItem,
  GridToolbar,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { DailyLog, DailyLogFilters, DailyLogPaginationOptions } from '../../services/daily-log.service';
import { format } from 'date-fns';

interface DailyLogListProps {
  dailyLogs: DailyLog[];
  totalDailyLogs: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onLoadDailyLogs: (filters?: DailyLogFilters, pagination?: DailyLogPaginationOptions) => void;
  onView?: (dailyLog: DailyLog) => void;
  onEdit?: (dailyLog: DailyLog) => void;
  onDelete?: (dailyLog: DailyLog) => void;
  onCreate?: () => void;
  projectId?: string;
}

const DailyLogList: React.FC<DailyLogListProps> = ({
  dailyLogs,
  totalDailyLogs,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  error,
  onLoadDailyLogs,
  onView,
  onEdit,
  onDelete,
  onCreate,
  projectId,
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherFilter, setWeatherFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Weather options for filter
  const weatherOptions = [
    'Sunny',
    'Partly Cloudy',
    'Cloudy',
    'Overcast',
    'Rainy',
    'Stormy',
    'Snowy',
    'Foggy',
    'Windy',
    'Hot',
    'Cold',
  ];

  // Handle search
  const handleSearch = useCallback(() => {
    const filters: DailyLogFilters = {
      search: searchQuery || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    };

    onLoadDailyLogs(filters, { page: 0, limit: pageSize });
  }, [searchQuery, dateFromFilter, dateToFilter, pageSize]); // Remove onLoadDailyLogs and weatherFilter

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setWeatherFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    onLoadDailyLogs({}, { page: 0, limit: pageSize });
  }, [pageSize]); // Remove onLoadDailyLogs

  // Handle pagination change
  const handlePaginationModelChange = useCallback((model: { page: number; pageSize: number }) => {
    const filters: DailyLogFilters = {
      search: searchQuery || undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
    };

    onLoadDailyLogs(filters, { page: model.page, limit: model.pageSize });
  }, [searchQuery, dateFromFilter, dateToFilter]); // Remove onLoadDailyLogs and weatherFilter

  // Load daily logs on mount
  useEffect(() => {
    onLoadDailyLogs({}, { page: 0, limit: pageSize });
  }, [pageSize]); // Remove onLoadDailyLogs from dependencies

  // Handle view action
  const handleView = useCallback((dailyLog: DailyLog) => {
    if (onView) {
      onView(dailyLog);
    }
  }, [onView]);

  // Handle edit action
  const handleEdit = useCallback((dailyLog: DailyLog) => {
    if (onEdit) {
      onEdit(dailyLog);
    }
  }, [onEdit]);

  // Handle delete action
  const handleDelete = useCallback((dailyLog: DailyLog) => {
    if (onDelete) {
      onDelete(dailyLog);
    }
  }, [onDelete]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Format crew members for display
  const formatCrewMembers = (crewMembers: any[] | null) => {
    if (!crewMembers || crewMembers.length === 0) return 'No crew';
    return `${crewMembers.length} member${crewMembers.length > 1 ? 's' : ''}`;
  };

  // Get weather chip color
  const getWeatherChipColor = (weather: string | null) => {
    if (!weather) return 'default';
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('sunny') || weatherLower.includes('hot')) return 'success';
    if (weatherLower.includes('cloudy') || weatherLower.includes('overcast')) return 'default';
    if (weatherLower.includes('rainy') || weatherLower.includes('stormy') || weatherLower.includes('snowy')) return 'error';
    if (weatherLower.includes('windy') || weatherLower.includes('foggy')) return 'warning';
    return 'default';
  };

  // Define columns
  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'project',
      headerName: 'Project',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.row.project?.name || 'Unknown Project'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.project?.projectNumber || ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'weather',
      headerName: 'Weather',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Chip
            label={params.value}
            size="small"
            color={getWeatherChipColor(params.value) as any}
            variant="outlined"
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not specified
          </Typography>
        )
      ),
    },
    {
      field: 'workPerformed',
      headerName: 'Work Performed',
      width: 300,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'crewMembers',
      headerName: 'Crew',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <GroupIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatCrewMembers(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'issues',
      headerName: 'Issues',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        params.value ? (
          <Tooltip title={params.value}>
            <WarningIcon color="warning" fontSize="small" />
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">
            None
          </Typography>
        )
      ),
    },
    {
      field: 'creator',
      headerName: 'Created By',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.row.creator ? 
            `${params.row.creator.firstName} ${params.row.creator.lastName}` : 
            'Unknown'
          }
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="view"
          icon={<ViewIcon />}
          label="View Details"
          onClick={(event) => {
            event.stopPropagation();
            handleView(params.row);
          }}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={(event) => {
            event.stopPropagation();
            handleEdit(params.row);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete(params.row);
          }}
        />,
      ],
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkIcon color="primary" />
          Daily Logs
          {projectId && (
            <Chip label="Project Filtered" size="small" color="primary" variant="outlined" />
          )}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {onCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreate}
            >
              New Daily Log
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={2} mb={2}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search work performed, issues, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Weather</InputLabel>
              <Select
                value={weatherFilter}
                label="Weather"
                onChange={(e) => setWeatherFilter(e.target.value)}
              >
                <MenuItem value="">All Weather</MenuItem>
                {weatherOptions.map((weather) => (
                  <MenuItem key={weather} value={weather}>
                    {weather}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Date From"
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              label="Date To"
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          </Box>
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Data Grid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={dailyLogs}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={totalDailyLogs}
          initialState={{
            pagination: {
              paginationModel: {
                page: currentPage,
                pageSize: pageSize,
              },
            },
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          onPaginationModelChange={handlePaginationModelChange}
          onRowClick={(params) => handleView(params.row)}
          disableRowSelectionOnClick={false}
          slots={{
            toolbar: GridToolbar,
            noRowsOverlay: () => (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}>
                <WorkIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="h6" color="text.secondary">
                  No daily logs found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {projectId ? 'No daily logs for this project yet.' : 'Create your first daily log to get started.'}
                </Typography>
                {onCreate && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onCreate}
                  >
                    Create Daily Log
                  </Button>
                )}
              </Box>
            ),
            loadingOverlay: () => (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Loading daily logs...
                </Typography>
              </Box>
            ),
          }}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default DailyLogList;
