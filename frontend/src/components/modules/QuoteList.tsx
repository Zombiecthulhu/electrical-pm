/**
 * Quote List Component
 * 
 * DataGrid-based list view for quotes with filtering, search, and CRUD operations.
 * Includes status filtering, client filtering, and pagination.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridActionsCellItem,
  GridToolbar,
  GridRenderCellParams
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ContentCopy as DuplicateIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  quoteService, 
  Quote, 
  QuoteStatus, 
  QuoteFilters 
} from '../../services/quote.service';
import { useQuoteStore } from '../../store/quote.store';
import { useClientStore } from '../../store/client.store';

interface QuoteListProps {
  onViewQuote: (quote: Quote) => void;
  onEditQuote: (quote: Quote) => void;
  onCreateQuote: () => void;
}

const QuoteList: React.FC<QuoteListProps> = ({
  onViewQuote,
  onEditQuote,
  onCreateQuote
}) => {
  const {
    quotes,
    loading,
    error,
    pagination,
    filters,
    fetchQuotes,
    deleteQuote,
    duplicateQuote,
    setFilters,
    clearError
  } = useQuoteStore();

  const { clients, loadClients } = useClientStore();

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>(filters.status || '');
  const [clientFilter, setClientFilter] = useState(filters.client_id || '');
  const [dateFrom, setDateFrom] = useState<Date | null>(filters.date_from ? new Date(filters.date_from) : null);
  const [dateTo, setDateTo] = useState<Date | null>(filters.date_to ? new Date(filters.date_to) : null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; quote: Quote | null }>({
    open: false,
    quote: null
  });

  // Load data on mount
  useEffect(() => {
    if (clients.length === 0) {
      loadClients();
    }
    fetchQuotes();
  }, [clients.length, loadClients, fetchQuotes]);

  // Apply filters
  const applyFilters = () => {
    const newFilters: QuoteFilters = {
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      client_id: clientFilter || undefined,
      date_from: dateFrom?.toISOString(),
      date_to: dateTo?.toISOString()
    };

    setFilters(newFilters);
    fetchQuotes(newFilters, { page: 1, limit: pagination.limit });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setClientFilter('');
    setDateFrom(null);
    setDateTo(null);
    setFilters({});
    fetchQuotes({}, { page: 1, limit: pagination.limit });
  };

  // Handle search
  const handleSearch = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      applyFilters();
    }
  };

  // Handle pagination
  const handlePaginationModelChange = (model: any) => {
    const newFilters = {
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      client_id: clientFilter || undefined,
      date_from: dateFrom?.toISOString(),
      date_to: dateTo?.toISOString()
    };

    fetchQuotes(newFilters, { page: model.page + 1, limit: model.pageSize });
  };

  // Handle delete
  const handleDelete = async () => {
    if (deleteDialog.quote) {
      try {
        await deleteQuote(deleteDialog.quote.id);
        setDeleteDialog({ open: false, quote: null });
      } catch (error) {
        // Error is handled by the store
      }
    }
  };

  // Handle duplicate
  const handleDuplicate = async (quote: Quote) => {
    try {
      const projectName = `${quote.project_name} (Copy)`;
      await duplicateQuote(quote.id, projectName);
    } catch (error) {
      // Error is handled by the store
    }
  };

  // Define columns
  const columns: GridColDef[] = [
    {
      field: 'quote_number',
      headerName: 'Quote #',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="medium">
          {params.value}
        </Typography>
      )
    },
    {
      field: 'project_name',
      headerName: 'Project Name',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" noWrap>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'client',
      headerName: 'Client',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" noWrap>
          {params.value?.name}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={quoteService.getStatusDisplayText(params.value)}
          color={quoteService.getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight="medium">
          {quoteService.formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'valid_until',
      headerName: 'Valid Until',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      )
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
          label="View"
          onClick={() => onViewQuote(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Edit"
          onClick={() => onEditQuote(params.row)}
        />,
        <GridActionsCellItem
          key="duplicate"
          icon={<DuplicateIcon />}
          label="Duplicate"
          onClick={() => handleDuplicate(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => setDeleteDialog({ open: true, quote: params.row })}
        />
      ]
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Quotes</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateQuote}
          >
            Create Quote
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filters
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(6, 1fr)' }} gap={2}>
              <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
                <TextField
                  fullWidth
                  label="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as QuoteStatus)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    {Object.values(QuoteStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {quoteService.getStatusDisplayText(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    label="Client"
                  >
                    <MenuItem value="">All</MenuItem>
                    {clients.map((client) => (
                      <MenuItem key={client.id} value={client.id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <DatePicker
                  label="From Date"
                  value={dateFrom}
                  onChange={(newValue) => setDateFrom(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Box>
              <Box>
                <DatePicker
                  label="To Date"
                  value={dateTo}
                  onChange={(newValue) => setDateTo(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Box>
              <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
                <Box display="flex" gap={1} height="100%">
                  <Button
                    variant="contained"
                    onClick={applyFilters}
                    fullWidth
                    sx={{ minHeight: '56px' }}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    fullWidth
                    sx={{ minHeight: '56px' }}
                  >
                    Clear
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Data Grid */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <DataGrid
              rows={quotes}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 20, 50]}
              paginationModel={{
                page: pagination.page - 1,
                pageSize: pagination.limit
              }}
              onPaginationModelChange={handlePaginationModelChange}
              rowCount={pagination.total}
              paginationMode="server"
              slots={{
                toolbar: GridToolbar
              }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0'
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, quote: null })}
        >
          <DialogTitle>Delete Quote</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete quote "{deleteDialog.quote?.quote_number}"?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialog({ open: false, quote: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default QuoteList;
