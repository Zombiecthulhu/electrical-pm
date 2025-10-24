/**
 * File List Component
 * 
 * Displays a list of files with actions like download, preview, and delete.
 * Supports different view modes and filtering options.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  MoreVert,
  Download,
  Visibility,
  Delete,
  Image,
  PictureAsPdf,
  Description,
  TableChart,
  FolderZip,
  InsertDriveFile,
  CloudDownload,
  Preview,
} from '@mui/icons-material';
import { File, fileService, FileCategory } from '../../services/file.service';

export interface FileListProps {
  files: File[];
  loading?: boolean;
  onDownload?: (file: File) => void;
  onPreview?: (file: File) => void;
  onDelete?: (file: File) => void;
  onCategoryFilter?: (category: FileCategory | null) => void;
  selectedCategory?: FileCategory | null;
  showActions?: boolean;
  viewMode?: 'grid' | 'list';
  className?: string;
}

/**
 * File List Component
 */
export const FileList: React.FC<FileListProps> = ({
  files,
  loading = false,
  onDownload,
  onPreview,
  onDelete,
  onCategoryFilter,
  selectedCategory,
  showActions = true,
  viewMode = 'grid',
  className,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, file: File) => {
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleDownload = () => {
    if (selectedFile && onDownload) {
      onDownload(selectedFile);
    }
    handleMenuClose();
  };

  const handlePreview = () => {
    if (selectedFile && onPreview) {
      onPreview(selectedFile);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedFile && onDelete) {
      onDelete(selectedFile);
    }
    setDeleteDialogOpen(false);
    setSelectedFile(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedFile(null);
  };

  const getFileIcon = (mimeType: string) => {
    const iconType = fileService.getFileIcon(mimeType);
    switch (iconType) {
      case 'image':
        return <Image color="primary" />;
      case 'picture_as_pdf':
        return <PictureAsPdf color="error" />;
      case 'description':
        return <Description color="action" />;
      case 'table_chart':
        return <TableChart color="action" />;
      case 'folder_zip':
        return <FolderZip color="action" />;
      default:
        return <InsertDriveFile color="action" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    return fileService.formatFileSize(bytes);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: FileCategory) => {
    const colors: Record<FileCategory, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      [FileCategory.DOCUMENT]: 'default',
      [FileCategory.PHOTO]: 'primary',
      [FileCategory.PLAN]: 'info',
      [FileCategory.SPEC]: 'secondary',
      [FileCategory.PERMIT]: 'warning',
      [FileCategory.CONTRACT]: 'error',
      [FileCategory.INVOICE]: 'success',
      [FileCategory.OTHER]: 'default',
    };
    return colors[category] || 'default';
  };

  const filteredFiles = selectedCategory
    ? files.filter(file => file.category === selectedCategory)
    : files;

  if (loading) {
    return (
      <Box className={className}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Box>
                <Skeleton variant="rectangular" height={100} />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (files.length === 0) {
    return (
      <Box className={className}>
        <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            No files found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload some files to get started
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={className}>
      {/* Category Filter */}
      {onCategoryFilter && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filter by category:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label="All"
              onClick={() => onCategoryFilter(null)}
              variant={selectedCategory === null ? 'filled' : 'outlined'}
              color="primary"
            />
            {Object.values(FileCategory).map(category => (
              <Chip
                key={category}
                label={category}
                onClick={() => onCategoryFilter(category)}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                color={getCategoryColor(category)}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Files Grid/List */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
        {filteredFiles.map((file) => (
          <Card
            key={file.id}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
            }}
          >
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 40,
                      height: 40,
                      mr: 2,
                    }}
                  >
                    {getFileIcon(file.mime_type)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      noWrap
                      title={file.original_filename}
                    >
                      {file.original_filename}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.file_size)}
                    </Typography>
                  </Box>
                  {showActions && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, file)}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={file.category}
                    size="small"
                    color={getCategoryColor(file.category)}
                    variant="outlined"
                  />
                  {file.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="filled"
                      sx={{ ml: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>

                {file.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {file.description}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Uploaded {formatDate(file.uploaded_at)}
                </Typography>

                {file.uploader && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    by {file.uploader.first_name} {file.uploader.last_name}
                  </Typography>
                )}
              </CardContent>

              {showActions && (
                <CardActions sx={{ pt: 0 }}>
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      onClick={() => onDownload?.(file)}
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Preview">
                    <IconButton
                      size="small"
                      onClick={() => onPreview?.(file)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              )}
            </Card>
        ))}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <CloudDownload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handlePreview}>
          <ListItemIcon>
            <Preview fontSize="small" />
          </ListItemIcon>
          <ListItemText>Preview</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedFile?.original_filename}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileList;
