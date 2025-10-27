/**
 * Employee List Component
 * 
 * Displays list of employees with search, filter, and pagination
 * Mobile-optimized: Uses MobileListView on mobile, DataGrid on desktop
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEmployeeStore } from '../../store';
import { Employee } from '../../services/employee.service';
import {
  MobileListView,
  MobileListItem,
  ConfirmDialog,
  EmptyState,
} from '../../components/common';
import { useMobileView } from '../../hooks';
import { formatDate } from '../../utils';

interface EmployeeListProps {
  onAdd: () => void;
  onEdit: (employee: Employee) => void;
  onView: (employee: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  onAdd,
  onEdit,
  onView,
}) => {
  const isMobile = useMobileView();
  
  // Store
  const {
    employees,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalEmployees,
    filters,
    fetchEmployees,
    deleteEmployee,
    setFilters,
    setPage,
    setPageSize,
  } = useEmployeeStore();

  // Local state
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Load employees on mount and when filters/pagination change
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        await fetchEmployees();
      } catch (error) {
        console.error('Failed to load employees:', error);
      }
    };
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Handle search
  const handleSearch = useCallback(() => {
    setFilters({
      ...filters,
      search: search.trim() || undefined,
    });
    setPage(1);
    fetchEmployees();
  }, [search, filters, setFilters, setPage, fetchEmployees]);

  // Handle classification filter change
  const handleClassificationChange = useCallback((value: string) => {
    setClassificationFilter(value);
    setFilters({
      ...filters,
      classification: value || undefined,
    });
    setPage(1);
    fetchEmployees();
  }, [filters, setFilters, setPage, fetchEmployees]);

  // Handle delete
  const handleDeleteClick = useCallback((employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (employeeToDelete) {
      await deleteEmployee(employeeToDelete.id);
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    }
  }, [employeeToDelete, deleteEmployee]);

  // Handle pagination
  const handlePaginationModelChange = useCallback((model: { page: number; pageSize: number }) => {
    setPage(model.page + 1); // MUI DataGrid is 0-indexed
    setPageSize(model.pageSize);
  }, [setPage, setPageSize]);

  // Refresh
  const handleRefresh = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // DataGrid columns
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => {
        return `${row.lastName}, ${row.firstName}`;
      },
    },
    {
      field: 'classification',
      headerName: 'Classification',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'employeeNumber',
      headerName: 'Employee #',
      width: 130,
      valueGetter: (value, row) => row.employeeNumber || '-',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      valueGetter: (value, row) => row.email || '-',
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
      valueGetter: (value, row) => row.phone || '-',
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? 'Active' : 'Inactive'}
          color={params.row.isActive ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => onEdit(params.row)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            title="Delete"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ], [onEdit, handleDeleteClick]);

  // Convert to MobileListItem format
  const mobileListItems: MobileListItem[] = useMemo(() => {
    return employees.map((employee) => ({
      id: employee.id,
      title: `${employee.firstName} ${employee.lastName}`,
      subtitle: employee.classification,
      description: employee.employeeNumber ? `Emp #: ${employee.employeeNumber}` : undefined,
      status: {
        label: employee.isActive ? 'Active' : 'Inactive',
        color: employee.isActive ? 'success' : 'default',
      },
      metadata: [
        { label: 'Email', value: employee.email || 'N/A' },
        { label: 'Phone', value: employee.phone || 'N/A' },
        { label: 'Hire Date', value: employee.hireDate ? formatDate(employee.hireDate) : 'N/A' },
      ],
      actions: [
        {
          label: 'Edit',
          icon: 'edit',
          onClick: () => onEdit(employee),
          color: 'primary',
        },
        {
          label: 'Delete',
          icon: 'delete',
          onClick: () => handleDeleteClick(employee),
          color: 'error',
        },
      ],
      onClick: () => onView(employee),
    }));
  }, [employees, onEdit, onView, handleDeleteClick]);

  // Unique classifications for filter dropdown
  const classifications = useMemo(() => {
    const unique = Array.from(new Set(employees.map(e => e.classification)));
    return unique.sort();
  }, [employees]);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Employees ({totalEmployees})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleRefresh} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            fullWidth={isMobile}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
            gap: 2,
          }}
        >
          <TextField
            placeholder="Search by name, email, or employee #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSearch} edge="end">
                  <SearchIcon />
                </IconButton>
              ),
            }}
            fullWidth
          />
          <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel>Classification</InputLabel>
            <Select
              value={classificationFilter}
              onChange={(e) => handleClassificationChange(e.target.value)}
              label="Classification"
            >
              <MenuItem value="">All</MenuItem>
              {classifications.map((classification) => (
                <MenuItem key={classification} value={classification}>
                  {classification}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Employee List/Grid */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
          <Button onClick={handleRefresh} sx={{ mt: 2 }}>
            Retry
          </Button>
        </Paper>
      ) : employees.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmptyState
            title="No Employees Found"
            description={
              search || classificationFilter
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first employee'
            }
            actionLabel="Add Employee"
            onAction={onAdd}
          />
        </Paper>
      ) : isMobile ? (
        <MobileListView items={mobileListItems} loading={isLoading} />
      ) : (
        <Paper>
          <DataGrid
            rows={employees}
            columns={columns}
            paginationModel={{
              page: currentPage - 1, // MUI is 0-indexed
              pageSize: pageSize,
            }}
            onPaginationModelChange={handlePaginationModelChange}
            pageSizeOptions={[10, 20, 50, 100]}
            rowCount={totalEmployees}
            paginationMode="server"
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Employee"
        message={
          employeeToDelete
            ? `Are you sure you want to delete ${employeeToDelete.firstName} ${employeeToDelete.lastName}? This action can be undone from the admin panel.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setEmployeeToDelete(null);
        }}
        confirmText="Delete"
      />
    </Box>
  );
};

export default EmployeeList;

