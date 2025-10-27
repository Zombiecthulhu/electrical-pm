/**
 * Client Management Page
 * 
 * A comprehensive client management interface that combines client listing,
 * creation, editing, and viewing functionality.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from '@mui/material';
import { ClientList } from '../components/modules/ClientList';
import { ClientForm } from '../components/modules/ClientForm';
import { Client } from '../services/client.service';

export interface ClientManagementPageProps {
  className?: string;
}

/**
 * Client Management Page Component
 */
const ClientManagementPage: React.FC<ClientManagementPageProps> = ({ className }) => {
  const navigate = useNavigate();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle create client
  const handleCreateClient = () => {
    setSelectedClient(null);
    setFormDialogOpen(true);
  };

  // Handle edit client
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormDialogOpen(true);
  };

  // Handle view client - navigate to detail page
  const handleViewClient = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  // Handle form save
  const handleFormSave = (client: Client) => {
    setFormDialogOpen(false);
    setSelectedClient(null);
    setSuccessMessage(
      selectedClient ? 'Client updated successfully' : 'Client created successfully'
    );
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setFormDialogOpen(false);
    setSelectedClient(null);
  };

  // Handle success message close
  const handleSuccessClose = () => {
    setSuccessMessage(null);
  };

  // Handle error message close
  const handleErrorClose = () => {
    setErrorMessage(null);
  };

  return (
    <Box className={className}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Typography color="text.primary">Client Management</Typography>
      </Breadcrumbs>

      {/* Client List */}
      <ClientList
        onEdit={handleEditClient}
        onView={handleViewClient}
        onCreate={handleCreateClient}
      />

      {/* Client Form Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleFormCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          {selectedClient ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>
        <DialogContent>
          <ClientForm
            client={selectedClient}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
          />
        </DialogContent>
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
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleErrorClose} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientManagementPage;
