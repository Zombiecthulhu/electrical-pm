/**
 * Document Browser Component
 * 
 * Advanced file management interface with:
 * - Left sidebar: Project-based folder tree
 * - Right panel: File list with table/grid view toggle
 * - Upload with drag-and-drop
 * - Search and filter controls
 * - File preview modal for PDFs and images
 * - Per-file download and delete actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Alert,
  Tooltip,
  Avatar,
  Menu,
  MenuItem as MenuItemComponent,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  InsertDriveFile as FileIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import FileUploadDialog from '../../components/modules/FileUploadDialog';
import fileService, { FileData, FileCategory } from '../../services/file.service';
import { projectService, Project } from '../../services';

interface FolderNode {
  id: string;
  name: string;
  type: 'project' | 'folder';
  projectId?: string;
  path?: string;
  children?: FolderNode[];
  fileCount?: number;
}

const DRAWER_WIDTH = 280;

const DocumentBrowser: React.FC = () => {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFile, setMenuFile] = useState<FileData | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalFiles, setTotalFiles] = useState(0);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  // Load files when filters change
  useEffect(() => {
    loadFiles();
  }, [selectedProject, selectedFolder, categoryFilter, favoritesOnly, page, pageSize]);

  const loadProjects = async () => {
    try {
      const response = await projectService.getAll({}, { page: 1, limit: 100 });
      setProjects(response.data.projects);
    } catch (err: any) {
      setError('Failed to load projects');
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        projectId: selectedProject || undefined,
        folderPath: selectedFolder || undefined,
        category: categoryFilter || undefined,
        search: searchTerm || undefined,
        isFavorite: favoritesOnly || undefined
      };

      const response = await fileService.listFiles(filters, {
        page: page + 1,
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

  const handleSearch = () => {
    setPage(0);
    loadFiles();
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedFolder(null);
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleFolderClick = (folderPath: string) => {
    setSelectedFolder(folderPath);
  };

  const handleUpload = async (data: any) => {
    try {
      await fileService.uploadFile({
        file: data.file,
        category: data.category,
        description: data.description,
        tags: data.tags,
        folderPath: data.folderPath,
        projectId: data.projectId || selectedProject || undefined
      });

      setSuccess('File uploaded successfully');
      loadFiles();
    } catch (err: any) {
      throw new Error(err.message || 'Upload failed');
    }
  };

  const handleView = (file: FileData) => {
    setSelectedFile(file);
    setPreviewDialogOpen(true);
  };

  const handleDownload = (file: FileData) => {
    const url = fileService.getDownloadUrl(file.id);
    window.open(url, '_blank');
  };

  const handleDeleteClick = (file: FileData) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
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

  const handleToggleFavorite = async (file: FileData) => {
    try {
      await fileService.toggleFavorite(file.id);
      setSuccess(`${file.is_favorite ? 'Removed from' : 'Added to'} favorites`);
      loadFiles();
    } catch (err: any) {
      setError(err.message || 'Failed to update favorite status');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: FileData) => {
    setAnchorEl(event.currentTarget);
    setMenuFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFile(null);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Open upload dialog with the dropped files
    setUploadDialogOpen(true);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon color="primary" />;
    } else if (mimeType === 'application/pdf') {
      return <PdfIcon color="error" />;
    } else {
      return <DocumentIcon color="action" />;
    }
  };

  const canPreview = (file: FileData) => {
    return file.mime_type.startsWith('image/') || file.mime_type === 'application/pdf';
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'icon',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: (params) => (
        <Avatar sx={{ bgcolor: 'transparent' }}>
          {getFileIcon(params.row.mime_type)}
        </Avatar>
      )
    },
    {
      field: 'original_filename',
      headerName: 'File Name',
      flex: 1,
      minWidth: 250
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
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          {canPreview(params.row) && (
            <Tooltip title="View">
              <IconButton size="small" onClick={() => handleView(params.row)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => handleDownload(params.row)}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="More">
            <IconButton size="small" onClick={(e) => handleMenuOpen(e, params.row)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', position: 'relative' }}>
      {/* Left Sidebar - Folder Tree */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            position: 'relative',
            borderRight: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Projects
          </Typography>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<RefreshIcon />}
            onClick={loadProjects}
          >
            Refresh
          </Button>
        </Box>
        <List sx={{ overflow: 'auto', flex: 1 }}>
          {/* All Files */}
          <ListItemButton
            selected={!selectedProject}
            onClick={() => {
              setSelectedProject(null);
              setSelectedFolder(null);
            }}
          >
            <ListItemIcon>
              <FolderIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="All Files" 
              secondary={`${totalFiles} files`}
            />
          </ListItemButton>

          <Divider sx={{ my: 1 }} />

          {/* Projects */}
          {projects.map((project) => (
            <Box key={project.id}>
              <ListItemButton
                selected={selectedProject === project.id && !selectedFolder}
                onClick={() => handleProjectClick(project.id)}
              >
                <ListItemIcon>
                  {expandedProjects.has(project.id) ? (
                    <ExpandMoreIcon />
                  ) : (
                    <ChevronRightIcon />
                  )}
                </ListItemIcon>
                <ListItemIcon>
                  {expandedProjects.has(project.id) ? (
                    <FolderOpenIcon color="warning" />
                  ) : (
                    <FolderIcon color="warning" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={project.name}
                  secondary={project.projectNumber}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true
                  }}
                />
              </ListItemButton>

              {/* Subfolders (if expanded) */}
              <Collapse in={expandedProjects.has(project.id)} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton
                    sx={{ pl: 4 }}
                    selected={selectedProject === project.id && selectedFolder === 'Electrical'}
                    onClick={() => {
                      setSelectedProject(project.id);
                      handleFolderClick('Electrical');
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Electrical" />
                  </ListItemButton>
                  <ListItemButton
                    sx={{ pl: 4 }}
                    selected={selectedProject === project.id && selectedFolder === 'Plans'}
                    onClick={() => {
                      setSelectedProject(project.id);
                      handleFolderClick('Plans');
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Plans" />
                  </ListItemButton>
                  <ListItemButton
                    sx={{ pl: 4 }}
                    selected={selectedProject === project.id && selectedFolder === 'Photos'}
                    onClick={() => {
                      setSelectedProject(project.id);
                      handleFolderClick('Photos');
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Photos" />
                  </ListItemButton>
                </List>
              </Collapse>
            </Box>
          ))}
        </List>
      </Drawer>

      {/* Main Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          p: 3,
          overflow: 'auto',
          ml: `${DRAWER_WIDTH}px`
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag and Drop Overlay */}
        {isDragging && (
          <Paper
            sx={{
              position: 'absolute',
              top: 0,
              left: DRAWER_WIDTH,
              right: 0,
              bottom: 0,
              bgcolor: 'primary.light',
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              border: '3px dashed',
              borderColor: 'primary.main'
            }}
          >
            <Box textAlign="center">
              <UploadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" color="primary.main">
                Drop files here to upload
              </Typography>
            </Box>
          </Paper>
        )}

        <Card>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">
                {selectedProject 
                  ? projects.find(p => p.id === selectedProject)?.name || 'Documents'
                  : 'All Documents'}
                {selectedFolder && ` / ${selectedFolder}`}
              </Typography>
              <Box display="flex" gap={1}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="list">
                    <ListViewIcon />
                  </ToggleButton>
                  <ToggleButton value="grid">
                    <GridViewIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload
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
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(4, 1fr)' }} gap={2}>
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
                </Select>
              </FormControl>
              <Button
                variant={favoritesOnly ? 'contained' : 'outlined'}
                startIcon={<StarIcon />}
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                sx={{ height: '56px' }}
              >
                Favorites
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadFiles}
                sx={{ height: '56px' }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* File List */}
          <Box sx={{ p: 2 }}>
            {viewMode === 'list' ? (
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
            ) : (
              <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
                {files.map((file) => (
                  <Card
                    key={file.id}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 4 },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box
                      sx={{
                        height: 150,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                        cursor: canPreview(file) ? 'pointer' : 'default'
                      }}
                      onClick={() => canPreview(file) && handleView(file)}
                    >
                      {file.mime_type.startsWith('image/') && file.thumbnail_path ? (
                        <Box
                          component="img"
                          src={fileService.getThumbnailUrl(file.id)}
                          alt={file.original_filename}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'transparent' }}>
                          {getFileIcon(file.mime_type)}
                        </Avatar>
                      )}
                    </Box>
                    <Box sx={{ p: 1.5, flexGrow: 1 }}>
                      <Typography variant="body2" noWrap title={file.original_filename}>
                        {file.original_filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fileService.formatFileSize(file.file_size)}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
                      <IconButton size="small" onClick={() => handleToggleFavorite(file)}>
                        {file.is_favorite ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                      </IconButton>
                      {canPreview(file) && (
                        <IconButton size="small" onClick={() => handleView(file)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => handleDownload(file)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, file)}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </Card>
      </Box>

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
        projectId={selectedProject || undefined}
        defaultCategory="DOCUMENT"
      />

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{selectedFile?.original_filename}</Typography>
            <IconButton onClick={() => setPreviewDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
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
              ) : selectedFile.mime_type === 'application/pdf' ? (
                <Box
                  component="iframe"
                  src={fileService.getViewUrl(selectedFile.id)}
                  sx={{ width: '100%', height: '70vh', border: 'none' }}
                />
              ) : (
                <Typography>Preview not available for this file type</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
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
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuFile && canPreview(menuFile) && (
          <MenuItemComponent
            onClick={() => {
              handleView(menuFile);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View</ListItemText>
          </MenuItemComponent>
        )}
        {menuFile && (
          <MenuItemComponent
            onClick={() => {
              handleDownload(menuFile);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItemComponent>
        )}
        {menuFile && (
          <MenuItemComponent
            onClick={() => {
              handleToggleFavorite(menuFile);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              {menuFile.is_favorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{menuFile.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}</ListItemText>
          </MenuItemComponent>
        )}
        <Divider />
        {menuFile && (
          <MenuItemComponent
            onClick={() => {
              handleDeleteClick(menuFile);
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItemComponent>
        )}
      </Menu>
    </Box>
  );
};

export default DocumentBrowser;

