/**
 * Client List Component
 * 
 * Displays a list of clients with search, filtering, and CRUD operations.
 * Uses Material-UI DataGrid for advanced table functionality.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Store as StoreIcon,
  Construction as ConstructionIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams, GridActionsCellItem } from '@mui/x-data-grid';
import { clientService, Client, ClientFilters } from '../../services/client.service';
import { useMobileView } from '../../hooks';
import { MobileListView, MobileListItem } from '../common';

export interface ClientListProps {
  onEdit?: (client: Client) => void;
  onView?: (client: Client) => void;
  onCreate?: () => void;
  className?: string;
}

/**
 * Client List Component
 */
export const ClientList: React.FC<ClientListProps> = ({
  onEdit,
  onView,
  onCreate,
  className,
}) => {
  const navigate = useNavigate();
  const isMobile = useMobileView();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 20,
    total: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Load clients
  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: ClientFilters = {};
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      if (typeFilter) {
        filters.type = typeFilter;
      }

      const response = await clientService.getAll(filters, {
        page: pagination.page + 1,
        limit: pagination.pageSize,
      });

      if (response.success && response.data) {
        setClients(response.data.clients);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
        }));
      } else {
        throw new Error(response.message || 'Failed to load clients');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, pagination.page, pagination.pageSize]);

  // Load clients on mount and when filters change
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Handle search
  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 0 }));
    loadClients();
  }, [loadClients]);

  // Handle type filter change
  const handleTypeFilterChange = useCallback((event: any) => {
    setTypeFilter(event.target.value);
    setPagination(prev => ({ ...prev, page: 0 }));
  }, []);

  // Handle pagination change
  const handlePaginationModelChange = useCallback((model: any) => {
    setPagination(prev => ({
      ...prev,
      page: model.page,
      pageSize: model.pageSize,
    }));
  }, []);

  // Handle client actions
  const handleEdit = useCallback((client: Client) => {
    if (onEdit) {
      onEdit(client);
    }
  }, [onEdit]);

  const handleView = useCallback((client: Client) => {
    if (onView) {
      onView(client);
    } else {
      navigate(`/clients/${client.id}`);
    }
  }, [onView, navigate]);

  const handleDeleteClick = useCallback((client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!clientToDelete) return;

    try {
      const response = await clientService.delete(clientToDelete.id);
      if (response.success) {
        setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        setDeleteDialogOpen(false);
        setClientToDelete(null);
      } else {
        throw new Error(response.message || 'Failed to delete client');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
    }
  }, [clientToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  }, []);

  // Get client type icon
  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'GENERAL_CONTRACTOR':
        return <ConstructionIcon />;
      case 'DEVELOPER':
        return <BusinessIcon />;
      case 'HOMEOWNER':
        return <HomeIcon />;
      case 'COMMERCIAL':
        return <StoreIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Get client type color
  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'GENERAL_CONTRACTOR':
        return 'primary';
      case 'DEVELOPER':
        return 'secondary';
      case 'HOMEOWNER':
        return 'success';
      case 'COMMERCIAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Format client type for display
  const formatClientType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Convert clients to mobile list items
  const mobileListItems: MobileListItem[] = clients.map((client) => ({
    id: client.id,
    title: client.name,
    subtitle: client.email || client.phone || 'No contact info',
    avatar: getClientTypeIcon(client.type),
    status: {
      label: formatClientType(client.type),
      color: getClientTypeColor(client.type) as any,
    },
    metadata: [
      ...(client.email ? [{ label: 'Email', value: client.email }] : []),
      ...(client.phone ? [{ label: 'Phone', value: client.phone }] : []),
      { label: 'Created', value: new Date(client.created_at).toLocaleDateString() },
    ],
    actions: [
      {
        label: 'View',
        icon: <MoreVertIcon />,
        onClick: () => handleView(client),
      },
      {
        label: 'Edit',
        icon: <EditIcon />,
        onClick: () => handleEdit(client),
      },
      {
        label: 'Delete',
        icon: <DeleteIcon />,
        onClick: () => handleDeleteClick(client),
        color: 'error' as const,
      },
    ],
    onClick: () => handleView(client),
  }));

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Client Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getClientTypeIcon(params.row.type)}
          <Typography variant="body2" fontWeight="medium">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 150,
      renderCell: (params) => (
        <Chip
          icon={getClientTypeIcon(params.value)}
          label={formatClientType(params.value)}
          color={getClientTypeColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          key="view"
          icon={<MoreVertIcon />}
          label="View Details"
          onClick={(event) => {
            event.stopPropagation();
            handleView(params.row);
          }}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit Client"
          onClick={(event) => {
            event.stopPropagation();
            handleEdit(params.row);
          }}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete Client"
          onClick={(event) => {
            event.stopPropagation();
            handleDeleteClick(params.row);
          }}
        />,
      ],
    },
  ];

  return (
    <Box className={className}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Clients
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your client relationships and contact information
        </Typography>
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: isMobile ? 1.5 : 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: isMobile ? 1.5 : 2, 
          alignItems: isMobile ? 'stretch' : 'center', 
          flexDirection: isMobile ? 'column' : 'row', 
          flexWrap: isMobile ? 'nowrap' : 'wrap'
        }}>
          <TextField
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            fullWidth={isMobile}
            sx={{ 
              minWidth: isMobile ? '100%' : 200,
              '& .MuiInputBase-input': { fontSize: '16px' },
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          <FormControl size="small" fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="GENERAL_CONTRACTOR">General Contractor</MenuItem>
              <MenuItem value="DEVELOPER">Developer</MenuItem>
              <MenuItem value="HOMEOWNER">Homeowner</MenuItem>
              <MenuItem value="COMMERCIAL">Commercial</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>

          {!isMobile && (
            <>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                disabled={loading}
                sx={{ minHeight: 44 }}
              >
                Search
              </Button>

              <Button
                variant="outlined"
                onClick={loadClients}
                disabled={loading}
                sx={{ minHeight: 44 }}
              >
                Refresh
              </Button>
            </>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            fullWidth={isMobile}
            sx={{ ml: isMobile ? 0 : 'auto', minHeight: 44 }}
          >
            Add Client
          </Button>
        </Box>
      </Paper>

      {/* Data Grid / Mobile List */}
      {isMobile ? (
        <>
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}
          {!loading && clients.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No clients found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchQuery || typeFilter ? 'Try adjusting your search criteria' : 'Get started by adding your first client'}
              </Typography>
              {onCreate && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={onCreate}
                  sx={{ minHeight: 44 }}
                >
                  Add Client
                </Button>
              )}
            </Paper>
          )}
          {!loading && clients.length > 0 && (
            <MobileListView items={mobileListItems} />
          )}
        </>
      ) : (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={clients}
            columns={columns}
            loading={loading}
            paginationMode="server"
            rowCount={pagination.total}
            pageSizeOptions={[10, 20, 50]}
            paginationModel={{
              page: pagination.page,
              pageSize: pagination.pageSize,
            }}
            onPaginationModelChange={handlePaginationModelChange}
            onRowClick={(params) => handleView(params.row)}
            disableRowSelectionOnClick={false}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No clients found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery || typeFilter ? 'Try adjusting your search criteria' : 'Get started by adding your first client'}
                  </Typography>
                </Box>
              ),
              loadingOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ),
            }}
          />
        </Paper>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Client
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{clientToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientList;
