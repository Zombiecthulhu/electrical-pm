/**
 * File Upload Component
 * 
 * A drag-and-drop file upload component with progress tracking,
 * file validation, and preview functionality.
 */

import React, { useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  TableChart,
  FolderZip,
} from '@mui/icons-material';
import { useFileUpload } from '../../hooks/useFileUpload';
import { fileService, FileCategory, File } from '../../services/file.service';

export interface FileUploadProps {
  projectId?: string;
  category: FileCategory;
  description?: string;
  tags?: string[];
  maxFiles?: number;
  onSuccess?: (files: File[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * File Upload Component
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  category,
  description,
  tags,
  maxFiles = 10,
  onSuccess,
  onError,
  disabled = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    uploadFiles,
    clearErrors,
    reset,
    setDragOver,
  } = useFileUpload({
    projectId,
    category,
    description,
    tags,
    maxFiles,
    onSuccess,
    onError,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled, setDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, [setDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFiles(files);
    }
  }, [disabled, uploadFiles, setDragOver]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = state.uploadedFiles.filter((_, i) => i !== index);
    // Note: This doesn't actually remove from server, just from local state
    // In a real implementation, you'd want to call a delete API
  }, [state.uploadedFiles]);

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

  return (
    <Box className={className}>
      {/* Upload Area */}
      <Paper
        elevation={state.isDragOver ? 8 : 2}
        sx={{
          p: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: state.isDragOver ? 'primary.main' : 'grey.300',
          backgroundColor: state.isDragOver ? 'action.hover' : 'background.paper',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease-in-out',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CloudUpload
          sx={{
            fontSize: 48,
            color: state.isDragOver ? 'primary.main' : 'grey.400',
            mb: 2,
          }}
        />
        
        <Typography variant="h6" gutterBottom>
          {state.isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to select files
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Max {maxFiles} files, 10MB each. Supported: Images, PDFs, Documents, Archives
        </Typography>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </Paper>

      {/* Progress Bar */}
      {state.isUploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={state.progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Uploading... {Math.round(state.progress)}%
          </Typography>
        </Box>
      )}

      {/* Error Messages */}
      {state.errors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {state.errors.map((error, index) => (
            <Alert key={index} severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          ))}
          <Button
            size="small"
            onClick={clearErrors}
            sx={{ mt: 1 }}
          >
            Clear Errors
          </Button>
        </Box>
      )}

      {/* Uploaded Files List */}
      {state.uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Uploaded Files ({state.uploadedFiles.length})
            </Typography>
            <Button
              size="small"
              onClick={reset}
              color="secondary"
            >
              Clear All
            </Button>
          </Box>
          
          <List>
            {state.uploadedFiles.map((file, index) => (
              <React.Fragment key={file.id}>
                <ListItem>
                  <ListItemIcon>
                    {getFileIcon(file.mime_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.original_filename}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.file_size)}
                        </Typography>
                        <Chip
                          label={file.category}
                          size="small"
                          variant="outlined"
                        />
                        {file.tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            variant="filled"
                            color="primary"
                          />
                        ))}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFile(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < state.uploadedFiles.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
