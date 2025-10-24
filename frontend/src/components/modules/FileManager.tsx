/**
 * File Manager Component
 * 
 * A comprehensive file management interface that combines file upload,
 * file listing, and file operations for a specific project.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  CloudUpload,
  Folder,
  Search,
  FilterList,
} from '@mui/icons-material';
import { FileUpload } from '../common/FileUpload';
import { FileList } from '../common/FileList';
import { fileService, File, FileCategory } from '../../services/file.service';
import { useFileUpload } from '../../hooks/useFileUpload';

export interface FileManagerProps {
  projectId?: string;
  className?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`file-tabpanel-${index}`}
      aria-labelledby={`file-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * File Manager Component
 */
export const FileManager: React.FC<FileManagerProps> = ({
  projectId,
  className,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FileCategory | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // File upload hook
  const {
    state: uploadState,
    uploadFiles,
    clearErrors,
    reset: resetUpload,
  } = useFileUpload({
    projectId,
    category: FileCategory.OTHER,
    onSuccess: (uploadedFiles) => {
      setFiles(prev => [...uploadedFiles, ...prev]);
      setSuccessMessage(`${uploadedFiles.length} file(s) uploaded successfully`);
      setUploadDialogOpen(false);
      resetUpload();
    },
    onError: (error) => {
      setError(error);
    },
  });

  // Load files
  const loadFiles = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fileService.getProjectFiles(projectId, {
        page: 1,
        limit: 100, // Load more files for better UX
      });

      if (response.success && response.data) {
        setFiles(response.data.files);
        
        // Extract unique tags
        const tags = new Set<string>();
        response.data.files.forEach(file => {
          file.tags.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags));
      } else {
        throw new Error(response.error?.message || 'Failed to load files');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Load files on mount and when project changes
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle file download
  const handleDownload = useCallback(async (file: File) => {
    try {
      const blob = await fileService.downloadFile(file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download file');
    }
  }, []);

  // Handle file preview
  const handlePreview = useCallback(async (file: File) => {
    try {
      const blob = await fileService.getFilePreview(file.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to preview file');
    }
  }, []);

  // Handle file delete
  const handleDelete = useCallback(async (file: File) => {
    try {
      const response = await fileService.deleteFile(file.id);
      if (response.success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        setSuccessMessage('File deleted successfully');
      } else {
        throw new Error(response.error?.message || 'Failed to delete file');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  }, []);

  // Handle category filter
  const handleCategoryFilter = useCallback((category: FileCategory | null) => {
    setSelectedCategory(category);
  }, []);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!projectId || !searchQuery.trim()) {
      loadFiles();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fileService.searchFiles({
        q: searchQuery,
        projectId,
        category: selectedCategory || undefined,
        page: 1,
        limit: 100,
      });

      if (response.success && response.data) {
        setFiles(response.data.files);
      } else {
        throw new Error(response.error?.message || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [projectId, searchQuery, selectedCategory, loadFiles]);

  // Handle upload dialog close
  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    resetUpload();
    clearErrors();
  };

  // Handle success message close
  const handleSuccessClose = () => {
    setSuccessMessage(null);
  };

  // Handle error close
  const handleErrorClose = () => {
    setError(null);
  };

  return (
    <Box className={className}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          File Manager
        </Typography>
        {projectId && (
          <Typography variant="body1" color="text.secondary">
            Manage files for this project
          </Typography>
        )}
      </Box>

      {/* Search and Filter Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            size="small"
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value as FileCategory || null)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {Object.values(FileCategory).map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<Search />}
            disabled={loading}
          >
            Search
          </Button>

          <Button
            variant="outlined"
            onClick={loadFiles}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            icon={<Folder />}
            label="All Files"
            iconPosition="start"
          />
          <Tab
            icon={<CloudUpload />}
            label="Upload Files"
            iconPosition="start"
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <FileList
            files={files}
            loading={loading}
            onDownload={handleDownload}
            onPreview={handlePreview}
            onDelete={handleDelete}
            onCategoryFilter={handleCategoryFilter}
            selectedCategory={selectedCategory}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <FileUpload
            projectId={projectId}
            category={FileCategory.OTHER}
            maxFiles={10}
            onSuccess={(uploadedFiles: File[]) => {
              setFiles(prev => [...uploadedFiles, ...prev]);
              setSuccessMessage(`${uploadedFiles.length} file(s) uploaded successfully`);
            }}
            onError={setError}
          />
        </TabPanel>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="upload files"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUpload
            projectId={projectId}
            category={FileCategory.OTHER}
            maxFiles={10}
            onSuccess={(uploadedFiles: File[]) => {
              setFiles(prev => [...uploadedFiles, ...prev]);
              setSuccessMessage(`${uploadedFiles.length} file(s) uploaded successfully`);
              handleUploadDialogClose();
            }}
            onError={setError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSuccessClose} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleErrorClose} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileManager;
