/**
 * File Management Page
 * 
 * A comprehensive file management interface for uploading, organizing,
 * and managing files across projects.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { FileManager } from '../components/modules/FileManager';

export interface FileManagementPageProps {
  className?: string;
}

/**
 * File Management Page Component
 */
const FileManagementPage: React.FC<FileManagementPageProps> = ({ className }) => {
  const { projectId } = useParams<{ projectId?: string }>();

  return (
    <Box className={className}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        {projectId ? (
          <>
            <Link color="inherit" href="/projects">
              Projects
            </Link>
            <Typography color="text.primary">Project Files</Typography>
          </>
        ) : (
          <Typography color="text.primary">File Management</Typography>
        )}
      </Breadcrumbs>

      {/* File Manager Component */}
      <FileManager projectId={projectId} />
    </Box>
  );
};

export default FileManagementPage;
