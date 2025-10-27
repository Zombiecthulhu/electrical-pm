/**
 * Client Detail Page
 * 
 * A comprehensive client detail view with tabs for:
 * - Overview (basic client information)
 * - Contacts (client contacts management)
 * - Projects History (projects associated with this client)
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  AccountBalance as TaxIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientStore } from '../store/client.store';
import { ClientContact } from '../services/client-contact.service';
import { ClientProject } from '../services/client-project.service';
import { ClientContactForm } from '../components/modules/ClientContactForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `client-tab-${index}`,
    'aria-controls': `client-tabpanel-${index}`,
  };
}

/**
 * Client Detail Page Component
 */
const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);

  const {
    currentClient,
    clientContacts,
    clientProjects,
    isLoading,
    error,
    contactsError,
    projectsError,
    loadClientById,
    loadClientContacts,
    loadClientProjects,
    clearError,
  } = useClientStore();

  // Load client data when component mounts or ID changes
  useEffect(() => {
    if (id) {
      console.log('Loading data for client ID:', id);
      loadClientById(id);
      loadClientContacts(id);
      loadClientProjects(id);
    }
  }, [id]); // Only depend on id, not the functions

  // Debug logging removed - functionality is working

  // Debug logging (removed to prevent infinite loops)

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle edit client
  const handleEditClient = () => {
    if (currentClient) {
      navigate(`/clients/${currentClient.id}/edit`);
    }
  };

  // Handle delete client
  const handleDeleteClient = () => {
    if (currentClient) {
      // TODO: Implement delete confirmation dialog
      console.log('Delete client:', currentClient.id);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/clients');
  };

  // Handle contact management
  const handleAddContact = () => {
    setEditingContact(null);
    setContactFormOpen(true);
  };

  const handleEditContact = (contact: ClientContact) => {
    setEditingContact(contact);
    setContactFormOpen(true);
  };

  const handleContactSave = (contact: ClientContact) => {
    setContactFormOpen(false);
    setEditingContact(null);
    // Reload contacts to get updated list
    if (id) {
      loadClientContacts(id);
    }
  };

  const handleContactCancel = () => {
    setContactFormOpen(false);
    setEditingContact(null);
  };

  // Handle project actions
  const handleViewProject = (project: ClientProject) => {
    navigate(`/projects/${project.id}`);
  };

  const handleCreateProject = () => {
    // Navigate to project creation with client pre-selected
    navigate(`/projects/new?clientId=${id}`);
  };

  // Get client type icon
  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'GENERAL_CONTRACTOR':
        return <BusinessIcon />;
      case 'DEVELOPER':
        return <BusinessIcon />;
      case 'HOMEOWNER':
        return <PersonIcon />;
      case 'COMMERCIAL':
        return <BusinessIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Get client type color
  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'GENERAL_CONTRACTOR':
        return 'primary';
      case 'DEVELOPER':
        return 'secondary';
      case 'HOMEOWNER':
        return 'success';
      case 'COMMERCIAL':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Format client type for display
  const formatClientType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format project status
  const formatProjectStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get project status color
  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'QUOTED':
        return 'info';
      case 'AWARDED':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETE':
        return 'success';
      case 'ON_HOLD':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
          Back to Clients
        </Button>
      </Box>
    );
  }

  if (!currentClient) {
    return (
      <Box>
        <Typography variant="h6" color="text.secondary">
          Client not found
        </Typography>
        <Button onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Clients
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Link color="inherit" href="/clients">
          Clients
        </Link>
        <Typography color="text.primary">{currentClient.name}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getClientTypeIcon(currentClient.type)}
            <Box>
              <Typography variant="h4" gutterBottom>
                {currentClient.name}
              </Typography>
              <Chip
                icon={getClientTypeIcon(currentClient.type)}
                label={formatClientType(currentClient.type)}
                color={getClientTypeColor(currentClient.type) as any}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditClient}
            >
              Edit
            </Button>
            <IconButton
              color="error"
              onClick={handleDeleteClient}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Quick Info */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          {currentClient.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="action" />
              <Typography variant="body2">{currentClient.email}</Typography>
            </Box>
          )}
          {currentClient.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="action" />
              <Typography variant="body2">{currentClient.phone}</Typography>
            </Box>
          )}
          {currentClient.website && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageIcon color="action" />
              <Typography variant="body2">{currentClient.website}</Typography>
            </Box>
          )}
          {currentClient.address && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon color="action" />
              <Typography variant="body2">{currentClient.address}</Typography>
            </Box>
          )}
          {currentClient.tax_id && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TaxIcon color="action" />
              <Typography variant="body2">{currentClient.tax_id}</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="client detail tabs"
          variant="fullWidth"
        >
          <Tab
            label="Overview"
            icon={<BusinessIcon />}
            iconPosition="start"
            {...a11yProps(0)}
          />
          <Tab
            label="Contacts"
            icon={<PersonIcon />}
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            label="Projects"
            icon={<AssignmentIcon />}
            iconPosition="start"
            {...a11yProps(2)}
          />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Client Information
          </Typography>
          
          {currentClient.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentClient.notes}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2">
                {new Date(currentClient.created_at).toLocaleDateString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
              <Typography variant="body2">
                {new Date(currentClient.updated_at).toLocaleDateString()}
              </Typography>
            </Box>
            {currentClient.creator && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body2">
                  {currentClient.creator.first_name} {currentClient.creator.last_name}
                </Typography>
              </Box>
            )}
            {currentClient.updater && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated By
                </Typography>
                <Typography variant="body2">
                  {currentClient.updater.first_name} {currentClient.updater.last_name}
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Contacts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Client Contacts ({clientContacts.length})
            </Typography>
            <Button variant="contained" size="small" onClick={handleAddContact}>
              Add Contact
            </Button>
          </Box>

          {contactsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {contactsError}
            </Alert>
          )}

          {clientContacts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No contacts found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add contacts to manage communication with this client
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {clientContacts.map((contact: ClientContact) => (
                <Card key={contact.id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div">
                        {contact.name}
                      </Typography>
                      {contact.is_primary && (
                        <Chip label="Primary" size="small" color="primary" />
                      )}
                    </Box>
                    {contact.title && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {contact.title}
                      </Typography>
                    )}
                    {contact.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{contact.email}</Typography>
                      </Box>
                    )}
                    {contact.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{contact.phone}</Typography>
                      </Box>
                    )}
                  </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => handleEditContact(contact)}>Edit</Button>
                      <Button size="small" color="error">Delete</Button>
                    </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>

        {/* Projects Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Project History ({clientProjects.length})
            </Typography>
            <Button variant="contained" size="small" onClick={handleCreateProject}>
              New Project
            </Button>
          </Box>

          {projectsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {projectsError}
            </Alert>
          )}

          {clientProjects.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No projects found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a new project for this client
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              {clientProjects.map((project: ClientProject) => (
                <Card key={project.id}>
                  <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {project.project_number}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={formatProjectStatus(project.status)}
                        color={getProjectStatusColor(project.status) as any}
                        size="small"
                      />
                    </Box>
                    {project.start_date && (
                      <Typography variant="body2" color="text.secondary">
                        Started: {new Date(project.start_date).toLocaleDateString()}
                      </Typography>
                    )}
                    {project.budget && (
                      <Typography variant="body2" color="text.secondary">
                        Budget: ${project.budget.toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleViewProject(project)}>View Details</Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Contact Form Dialog */}
      <ClientContactForm
        clientId={id || ''}
        contact={editingContact}
        onSave={handleContactSave}
        onCancel={handleContactCancel}
        open={contactFormOpen}
      />
    </Box>
  );
};

export default ClientDetail;
