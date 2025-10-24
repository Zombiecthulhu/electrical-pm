/**
 * File Management Page
 * 
 * Main page for managing all files across projects.
 * Provides upload, view, download, and organization capabilities.
 */

import React from 'react';
import { Container } from '@mui/material';
import { FileManager } from '../components/modules';

const FileManagement: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <FileManager />
    </Container>
  );
};

export default FileManagement;
