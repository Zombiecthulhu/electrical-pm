/**
 * File Upload Dialog Component
 * 
 * Dialog for uploading files with metadata input including category,
 * description, tags, and folder path.
 */

import React, { useState } from 'react';
import {
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
  Box,
  Typography,
  Alert,
  LinearProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Add as AddIcon
} from '@mui/icons-material';

export interface FileUploadData {
  file: File;
  category: string;
  description: string;
  tags: string[];
  folderPath: string;
  projectId?: string;
  dailyLogId?: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (data: FileUploadData) => Promise<void>;
  projectId?: string;
  dailyLogId?: string;
  defaultCategory?: string;
}

const FILE_CATEGORIES = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'PHOTO', label: 'Photo' },
  { value: 'PLAN', label: 'Plan/Drawing' },
  { value: 'SPEC', label: 'Specification' },
  { value: 'PERMIT', label: 'Permit' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'REPORT', label: 'Report' },
  { value: 'OTHER', label: 'Other' }
];

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onClose,
  onUpload,
  projectId,
  dailyLogId,
  defaultCategory = 'DOCUMENT'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState(defaultCategory);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-set description to filename without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setDescription(nameWithoutExt);
      setError(null);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await onUpload({
        file: selectedFile,
        category,
        description,
        tags,
        folderPath,
        projectId,
        dailyLogId
      });

      // Reset form
      setSelectedFile(null);
      setDescription('');
      setTags([]);
      setTagInput('');
      setFolderPath('');
      setCategory(defaultCategory);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setDescription('');
      setTags([]);
      setTagInput('');
      setFolderPath('');
      setError(null);
      setCategory(defaultCategory);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Upload File</Typography>
          <IconButton onClick={handleClose} disabled={uploading} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* File Selection */}
        <Box mb={3}>
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="file-upload-input"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <label htmlFor="file-upload-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<UploadIcon />}
              fullWidth
              disabled={uploading}
              sx={{ py: 2 }}
            >
              {selectedFile ? 'Change File' : 'Select File'}
            </Button>
          </label>

          {selectedFile && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="body2" fontWeight="bold">
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Category Selection */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Category *</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            label="Category *"
            disabled={uploading}
          >
            {FILE_CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Description */}
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
          disabled={uploading}
          helperText="Optional: Add a description for this file"
        />

        {/* Folder Path */}
        <TextField
          fullWidth
          label="Folder Path"
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          margin="normal"
          disabled={uploading}
          placeholder="e.g., Electrical/Phase1"
          helperText="Optional: Organize files into virtual folders"
        />

        {/* Tags */}
        <Box mt={2}>
          <TextField
            fullWidth
            label="Add Tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            disabled={uploading}
            placeholder="Press Enter to add tag"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleAddTag} disabled={!tagInput.trim() || uploading} size="small">
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          {tags.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                  disabled={uploading}
                />
              ))}
            </Box>
          )}
        </Box>

        {uploading && (
          <Box mt={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Uploading file...
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || uploading}
          startIcon={<UploadIcon />}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadDialog;

