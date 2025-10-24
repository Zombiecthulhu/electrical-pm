/**
 * File Manager Component
 * 
 * Displays and manages uploaded files with filtering, search, and actions.
 * Supports file upload via dialog, viewing, downloading, and metadata editing.
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
  Grid,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import FileUploadDialog from './FileUploadDialog';
import fileService, { FileData, FileFilters } from '../../services/file.service';

interface FileManagerProps {
  projectId?: string;
  dailyLogId?: string;
  defaultCategory?: string;
}

const FileManager: React.FC<FileManagerProps> = ({
  projectId,
  dailyLogId,
  defaultCategory
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalFiles, setTotalFiles] = useState(0);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: FileFilters = {
        projectId,
        dailyLogId,
        category: categoryFilter || undefined,
        search: searchTerm || undefined,
        isFavorite: favoritesOnly || undefined
      };

      const response = await fileService.listFiles(filters, {
        page: page + 1, // API uses 1-based pagination
        limit: pageSize
      });

      setFiles(response.files);
      setTotalFiles(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [page, pageSize, categoryFilter, favoritesOnly, projectId, dailyLogId]);

  const handleSearch = () => {
    setPage(0);
    loadFiles();
  };

  const handleUpload = async (data: any) => {
    try {
      await fileService.uploadFile({
        file: data.file,
        category: data.category,
        description: data.description,
        tags: data.tags,
        folderPath: data.folderPath,
        projectId: data.projectId,
        dailyLogId: data.dailyLogId
      });

      setSuccess('File uploaded successfully');
      loadFiles();
    } catch (err: any) {
      throw new Error(err.message || 'Upload failed');
    }
  };

  const handleToggleFavorite = async (file: FileData) => {
    try {
      await fileService.toggleFavorite(file.id);
      setSuccess(`${file.is_favorite ? 'Removed from' : 'Added to'} favorites`);
      loadFiles();
    } catch (err: any) {
      setError(err.message || 'Failed to update favorite status');
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;

    try {
      await fileService.deleteFile(selectedFile.id);
      setSuccess('File deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedFile(null);
      loadFiles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const handleView = (file: FileData) => {
    setSelectedFile(file);
    setViewDialogOpen(true);
  };

  const handleDownload = (file: FileData) => {
    const url = fileService.getDownloadUrl(file.id);
    window.open(url, '_blank');
  };

  const getFileIcon = (file: FileData) => {
    if (file.mime_type.startsWith('image/')) {
      return <ImageIcon color="primary" />;
    }
    return <DocumentIcon color="action" />;
  };

  const columns: GridColDef[] = [
    {
      field: 'icon',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => getFileIcon(params.row)
    },
    {
      field: 'original_filename',
      headerName: 'File Name',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={fileService.getCategoryDisplayName(params.value)}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'file_size',
      headerName: 'Size',
      width: 100,
      renderCell: (params) => fileService.formatFileSize(params.value)
    },
    {
      field: 'uploaded_at',
      headerName: 'Uploaded',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'uploader',
      headerName: 'Uploaded By',
      width: 150,
      renderCell: (params) => `${params.value.first_name} ${params.value.last_name}`
    },
    {
      field: 'is_favorite',
      headerName: 'Fav',
      width: 70,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleToggleFavorite(params.row)}
        >
          {params.value ? <StarIcon color="warning" /> : <StarBorderIcon />}
        </IconButton>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleView(params.row)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => handleDownload(params.row)}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedFile(params.row);
                setDeleteDialogOpen(true);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Card>
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">
              File Manager
            </Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadFiles}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload File
              </Button>
            </Box>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Filters */}
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(4, 1fr)' }} gap={2} mb={3}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="DOCUMENT">Document</MenuItem>
                <MenuItem value="PHOTO">Photo</MenuItem>
                <MenuItem value="PLAN">Plan</MenuItem>
                <MenuItem value="SPEC">Specification</MenuItem>
                <MenuItem value="PERMIT">Permit</MenuItem>
                <MenuItem value="CONTRACT">Contract</MenuItem>
                <MenuItem value="INVOICE">Invoice</MenuItem>
                <MenuItem value="RECEIPT">Receipt</MenuItem>
                <MenuItem value="REPORT">Report</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant={favoritesOnly ? 'contained' : 'outlined'}
              startIcon={<StarIcon />}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              sx={{ height: '56px' }}
            >
              Favorites Only
            </Button>
          </Box>

          {/* Data Grid */}
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={files}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 20, 50, 100]}
              paginationMode="server"
              rowCount={totalFiles}
              paginationModel={{ page, pageSize }}
              onPaginationModelChange={(model) => {
                setPage(model.page);
                setPageSize(model.pageSize);
              }}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
        projectId={projectId}
        dailyLogId={dailyLogId}
        defaultCategory={defaultCategory}
      />

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedFile?.original_filename}
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box>
              {selectedFile.mime_type.startsWith('image/') ? (
                <Box
                  component="img"
                  src={fileService.getViewUrl(selectedFile.id)}
                  alt={selectedFile.original_filename}
                  sx={{ width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' }}
                />
              ) : (
                <Box textAlign="center" py={4}>
                  <DocumentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    Preview not available for this file type
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(selectedFile)}
                    sx={{ mt: 2 }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Category:</strong> {fileService.getCategoryDisplayName(selectedFile.category)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Size:</strong> {fileService.formatFileSize(selectedFile.file_size)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Uploaded:</strong> {new Date(selectedFile.uploaded_at).toLocaleString()}
                </Typography>
                {selectedFile.description && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Description:</strong> {selectedFile.description}
                  </Typography>
                )}
                {selectedFile.tags.length > 0 && (
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Tags:</strong>
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {selectedFile.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedFile && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleDownload(selectedFile)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedFile?.original_filename}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileManager;
