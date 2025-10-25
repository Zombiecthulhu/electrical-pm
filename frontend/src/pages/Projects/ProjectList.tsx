/**
 * Project List Page
 * 
 * Displays a comprehensive list of projects with search, filtering,
 * pagination, and CRUD operations using Material-UI DataGrid.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridActionsCellItem,
  GridToolbar,
  GridRowId,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  ViewList as ListViewIcon,
  ViewModule as KanbanViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  useProjects, 
  useProjectLoading, 
  useProjectError, 
  useProjectPagination, 
  useProjectStore
} from '../../store';
import { Project, ProjectFilters } from '../../services/project.service';
import ProjectKanban from './ProjectKanban';
import { useMobileView } from '../../hooks';
import { MobileListView, MobileListItem, DeleteConfirmDialog } from '../../components/common';

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'QUOTED':
      return 'default';
    case 'AWARDED':
      return 'info';
    case 'IN_PROGRESS':
      return 'primary';
    case 'INSPECTION':
      return 'warning';
    case 'COMPLETE':
      return 'success';
    default:
      return 'default';
  }
};

// Status display mapping
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'QUOTED':
      return 'Quoted';
    case 'AWARDED':
      return 'Awarded';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'INSPECTION':
      return 'Inspection';
    case 'COMPLETE':
      return 'Complete';
    default:
      return status;
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format billing type
const getBillingTypeLabel = (billingType: string) => {
  switch (billingType) {
    case 'TIME_AND_MATERIALS':
      return 'T&M';
    case 'LUMP_SUM':
      return 'Lump Sum';
    case 'SERVICE_CALL':
      return 'Service Call';
    default:
      return billingType;
  }
};

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMobileView();
  
  // Store state
  const projects = useProjects();
  const isLoading = useProjectLoading();
  const error = useProjectError();
  const pagination = useProjectPagination();
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const clearError = useProjectStore((state) => state.clearError);

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Load projects on component mount and when filters change
  useEffect(() => {
    const currentFilters: ProjectFilters = {
      search: searchTerm || undefined,
      status: statusFilter || undefined,
    };
    
    fetchProjects(currentFilters, { page: page + 1, limit: pageSize });
  }, [searchTerm, statusFilter, page, pageSize]); // Removed fetchProjects from dependencies

  // Handle search
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  }, []);

  // Handle status filter
  const handleStatusFilterChange = useCallback((event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  }, []);

  // Handle view mode change
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'list' | 'kanban' | null,
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Handle row click
  const handleRowClick = useCallback((params: GridRowParams) => {
    navigate(`/projects/${params.id}`);
  }, [navigate]);

  // Handle view action
  const handleView = useCallback((id: string) => {
    navigate(`/projects/${id}`);
  }, [navigate]);

  // Handle edit action
  const handleEdit = useCallback((id: string) => {
    navigate(`/projects/${id}/edit`);
  }, [navigate]);

  // Handle delete action
  const handleDeleteClick = useCallback((project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm delete
  const handleDeleteConfirm = useCallback(async () => {
    if (projectToDelete) {
      const success = await deleteProject(projectToDelete.id);
      if (success) {
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      }
    }
  }, [projectToDelete, deleteProject]);

  // Cancel delete
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  }, []);

  // Handle new project
  const handleNewProject = useCallback(() => {
    navigate('/projects/new');
  }, [navigate]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setPage(0);
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(0);
  }, []);

  // Convert projects to mobile list items
  const mobileListItems: MobileListItem[] = projects.map((project) => ({
    id: project.id,
    title: project.name,
    subtitle: project.client?.name || 'No Client',
    description: `${getBillingTypeLabel(project.billingType)} • ${project.type}`,
    status: {
      label: getStatusLabel(project.status),
      color: getStatusColor(project.status) as any,
    },
    metadata: [
      { label: 'Project #', value: `#${project.projectNumber}` },
      { label: 'Start Date', value: project.startDate ? formatDate(project.startDate) : 'Not set' },
      { label: 'Budget', value: project.budget ? formatCurrency(project.budget) : 'N/A' },
    ],
    actions: [
      {
        label: 'View',
        icon: <ViewIcon />,
        onClick: () => handleView(project.id),
      },
      {
        label: 'Edit',
        icon: <EditIcon />,
        onClick: () => handleEdit(project.id),
      },
      {
        label: 'Delete',
        icon: <DeleteIcon />,
        onClick: () => handleDeleteClick(project),
        color: 'error' as const,
      },
    ],
    onClick: () => navigate(`/projects/${project.id}`),
  }));

  // Define columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Project Name',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>
            {params.value}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ 
            fontWeight: 'bold',
            backgroundColor: 'action.hover',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            display: 'inline-block',
            fontSize: '0.75rem'
          }}>
            #{params.row.projectNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {getBillingTypeLabel(params.row.billingType)} • {params.row.type}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'client',
      headerName: 'Client',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <BusinessIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {params.row.client?.name || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value) as any}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatDate(params.value)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'budget',
      headerName: 'Budget',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box display="flex" alignItems="center" gap={1}>
          <MoneyIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {formatCurrency(params.value)}
          </Typography>
        </Box>
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
          icon={
            <Tooltip title="View Project">
              <ViewIcon />
            </Tooltip>
          }
          label="View"
          onClick={() => handleView(params.id as string)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={
            <Tooltip title="Edit Project">
              <EditIcon />
            </Tooltip>
          }
          label="Edit"
          onClick={() => handleEdit(params.id as string)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={
            <Tooltip title="Delete Project">
              <DeleteIcon />
            </Tooltip>
          }
          label="Delete"
          onClick={() => handleDeleteClick(params.row)}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={isMobile ? 'flex-start' : 'center'} 
        mb={3}
        flexDirection={isMobile ? 'column' : 'row'}
        gap={isMobile ? 2 : 0}
      >
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight="bold">
          Projects
        </Typography>
        <Box display="flex" alignItems="center" gap={2} width={isMobile ? '100%' : 'auto'}>
          {/* View Toggle - Hide on mobile */}
          {!isMobile && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              aria-label="view mode"
            >
              <ToggleButton value="list" aria-label="list view">
                <ListViewIcon />
              </ToggleButton>
              <ToggleButton value="kanban" aria-label="kanban view">
                <KanbanViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewProject}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 140, minHeight: 44 }}
          >
            New Project
          </Button>
        </Box>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 3 }}>
        <Box 
          display="flex" 
          gap={isMobile ? 1.5 : 2} 
          alignItems={isMobile ? 'stretch' : 'center'}
          flexDirection={isMobile ? 'column' : 'row'}
        >
          <TextField
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearchChange}
            size="small"
            fullWidth={isMobile}
            sx={{ 
              minWidth: isMobile ? '100%' : 200, 
              flexGrow: 1,
              '& .MuiInputBase-input': {
                fontSize: '16px', // Prevent iOS zoom
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl 
            size="small" 
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 120 }}
          >
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="QUOTED">Quoted</MenuItem>
              <MenuItem value="AWARDED">Awarded</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="INSPECTION">Inspection</MenuItem>
              <MenuItem value="COMPLETE">Complete</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={handleClearFilters}
            disabled={!searchTerm && !statusFilter}
            fullWidth={isMobile}
            sx={{ minHeight: 44 }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        isMobile ? (
          /* Mobile Card List */
          <>
            {isLoading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}
            {!isLoading && projects.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No projects yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first project to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleNewProject}
                  sx={{ minHeight: 44 }}
                >
                  Create Project
                </Button>
              </Paper>
            )}
            {!isLoading && projects.length > 0 && (
              <MobileListView items={mobileListItems} />
            )}
          </>
        ) : (
          /* Desktop Data Grid */
          <Paper sx={{ height: 600, width: '100%' }}>
            <DataGrid
            rows={projects}
            columns={columns}
            loading={isLoading}
            onRowClick={handleRowClick}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: pageSize,
                  page: page,
                },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationMode="server"
            rowCount={pagination?.total || 0}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            disableRowSelectionOnClick
            disableColumnMenu
            sx={{
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
            slots={{
              toolbar: GridToolbar,
              noRowsOverlay: () => (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  gap={2}
                >
                  <Typography variant="h6" color="text.secondary">
                    No projects yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first project to get started
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewProject}
                  >
                    Create Project
                  </Button>
                </Box>
              ),
              loadingOverlay: () => (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="100%"
                  gap={2}
                >
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    Loading projects...
                  </Typography>
                </Box>
              ),
            }}
          />
        </Paper>
        )
      ) : (
        /* Kanban View */
        <ProjectKanban />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName="Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default ProjectList;
