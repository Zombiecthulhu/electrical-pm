/**
 * Project Form Page
 * 
 * Handles creating and editing projects with comprehensive form validation,
 * Material-UI components, and react-hook-form for state management.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Paper,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  useProjectStore, 
  useProjectLoading, 
  useProjectError 
} from '../../store';
import { CreateProjectData, UpdateProjectData } from '../../services/project.service';
import { clientService, Client } from '../../services/client.service';
import { clientContactService, ClientContact } from '../../services/client-contact.service';
import { 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

// Form data interface
interface ProjectFormData {
  name: string;
  projectNumber: string;
  clientId: string;
  contactId: string;
  type: 'Commercial' | 'Residential' | 'Industrial';
  billingType: 'TIME_AND_MATERIALS' | 'LUMP_SUM' | 'SERVICE_CALL';
  location: string;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | '';
  description: string;
}

// Default form values
const defaultValues: ProjectFormData = {
  name: '',
  projectNumber: '',
  clientId: '',
  contactId: '',
  type: 'Commercial',
  billingType: 'TIME_AND_MATERIALS',
  location: '',
  startDate: null,
  endDate: null,
  budget: '',
  description: '',
};

// Project type options
const projectTypes = [
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Residential', label: 'Residential' },
  { value: 'Industrial', label: 'Industrial' },
];

// Billing type options
const billingTypes = [
  { value: 'TIME_AND_MATERIALS', label: 'T&M (Time & Materials)' },
  { value: 'LUMP_SUM', label: 'Lump Sum' },
  { value: 'SERVICE_CALL', label: 'Service Call' },
];

// Client data will be fetched from API

const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Store state
  const { createProject, updateProject, fetchProject, selectedProject } = useProjectStore();
  const isLoading = useProjectLoading();
  const error = useProjectError();

  // Local state
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [clientContacts, setClientContacts] = useState<ClientContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProjectFormData>({
    defaultValues,
    mode: 'onChange',
  });

  // Watch start date for end date validation
  const startDate = watch('startDate');
  
  // Watch client ID to load contacts
  const selectedClientId = watch('clientId');

  // Load clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        setClientsError(null);
        const response = await clientService.getAll();
        if (response.success) {
          setClients(response.data.clients);
        } else {
          setClientsError('Failed to load clients');
        }
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        setClientsError(error.message || 'Failed to load clients');
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Load client contacts when client is selected
  useEffect(() => {
    const fetchClientContacts = async () => {
      if (!selectedClientId) {
        setClientContacts([]);
        return;
      }

      try {
        setContactsLoading(true);
        setContactsError(null);
        const response = await clientContactService.getAll(selectedClientId);
        if (response.success) {
          setClientContacts(response.data.contacts || []);
        } else {
          setContactsError('Failed to load contacts');
        }
      } catch (error: any) {
        console.error('Error fetching contacts:', error);
        setContactsError(error.message || 'Failed to load contacts');
      } finally {
        setContactsLoading(false);
      }
    };

    fetchClientContacts();
  }, [selectedClientId]);

  // Load project data for editing
  useEffect(() => {
    if (isEdit && id) {
      fetchProject(id);
    }
  }, [isEdit, id, fetchProject]);

  // Reset form when project data is loaded
  useEffect(() => {
    if (isEdit && selectedProject) {
      reset({
        name: selectedProject.name || '',
        projectNumber: selectedProject.projectNumber || '',
        clientId: selectedProject.clientId || '',
        contactId: selectedProject.contactId || '',
        type: (selectedProject.type as 'Commercial' | 'Residential' | 'Industrial') || 'Commercial',
        billingType: selectedProject.billingType || 'TIME_AND_MATERIALS',
        location: selectedProject.location || '',
        startDate: selectedProject.startDate ? new Date(selectedProject.startDate) : null,
        endDate: selectedProject.endDate ? new Date(selectedProject.endDate) : null,
        budget: selectedProject.budget || '',
        description: selectedProject.description || '',
      });
    }
  }, [isEdit, selectedProject, reset]);

  // Handle form submission
  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Prepare form data
      const formData = {
        name: data.name,
        projectNumber: data.projectNumber,
        clientId: data.clientId,
        contactId: data.contactId || null,
        type: data.type,
        billingType: data.billingType,
        location: data.location,
        startDate: data.startDate?.toISOString().split('T')[0] || '',
        endDate: data.endDate?.toISOString().split('T')[0] || undefined,
        budget: Number(data.budget),
        description: data.description || null,
      };

      if (isEdit && id) {
        // Update existing project
        const result = await updateProject(id, formData as UpdateProjectData);
        if (result) {
          setSuccessMessage('Project updated successfully!');
          setTimeout(() => navigate('/projects'), 2000);
        }
      } else {
        // Create new project
        const result = await createProject(formData as CreateProjectData);
        if (result) {
          setSuccessMessage('Project created successfully!');
          setTimeout(() => navigate('/projects'), 2000);
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/projects');
  };

  // Clear success message
  const handleClearSuccess = () => {
    setSuccessMessage('');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        {/* Page Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </Typography>
        </Box>

        {/* Success Message */}
        {successMessage && (
          <Alert 
            severity="success" 
            onClose={handleClearSuccess}
            sx={{ mb: 3 }}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 3,
              }}
            >
              {/* Project Name */}
              <Box>
                <Controller
                  name="name"
                  control={control}
                  rules={{ 
                    required: 'Project name is required',
                    minLength: {
                      value: 3,
                      message: 'Project name must be at least 3 characters'
                    }
                  }}
                  render={({ field }: { field: any }) => (
                    <TextField
                      {...field}
                      label="Project Name"
                      fullWidth
                      required
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      InputProps={{
                        startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  )}
                />
              </Box>

              {/* Project Number */}
              <Box>
                <Controller
                  name="projectNumber"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[A-Z0-9-]+$/,
                      message: 'Project number must contain only uppercase letters, numbers, and hyphens'
                    }
                  }}
                  render={({ field }: { field: any }) => (
                    <TextField
                      {...field}
                      label="Project Number"
                      fullWidth
                      placeholder="e.g., ELEC-2024-001"
                      error={!!errors.projectNumber}
                      helperText={errors.projectNumber?.message || 'Optional project identifier'}
                    />
                  )}
                />
              </Box>

              {/* Client Selection */}
              <Box>
                <Controller
                  name="clientId"
                  control={control}
                  rules={{ required: 'Client selection is required' }}
                  render={({ field }: { field: any }) => (
                    <FormControl fullWidth required error={!!errors.clientId}>
                      <InputLabel>Client</InputLabel>
                      <Select
                        {...field}
                        label="Client"
                        startAdornment={<BusinessIcon sx={{ mr: 1, color: 'action.active' }} />}
                        disabled={clientsLoading}
                      >
                        {clientsLoading ? (
                          <MenuItem disabled>Loading clients...</MenuItem>
                        ) : clientsError ? (
                          <MenuItem disabled>Error loading clients</MenuItem>
                        ) : clients.length === 0 ? (
                          <MenuItem disabled>No clients available</MenuItem>
                        ) : (
                          clients.map((client) => (
                            <MenuItem key={client.id} value={client.id}>
                              {client.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {errors.clientId && (
                        <FormHelperText>{errors.clientId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Box>

              {/* Client Contact Selection */}
              <Box>
                <Controller
                  name="contactId"
                  control={control}
                  render={({ field }: { field: any }) => (
                    <FormControl fullWidth error={!!errors.contactId}>
                      <InputLabel>Primary Contact</InputLabel>
                      <Select
                        {...field}
                        label="Primary Contact"
                        disabled={!selectedClientId || contactsLoading}
                      >
                        {!selectedClientId ? (
                          <MenuItem disabled>Select a client first</MenuItem>
                        ) : contactsLoading ? (
                          <MenuItem disabled>Loading contacts...</MenuItem>
                        ) : contactsError ? (
                          <MenuItem disabled>Error loading contacts</MenuItem>
                        ) : clientContacts.length === 0 ? (
                          <MenuItem disabled>No contacts available</MenuItem>
                        ) : (
                          clientContacts.map((contact) => (
                            <MenuItem key={contact.id} value={contact.id}>
                              {contact.name} {contact.title && `- ${contact.title}`}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {errors.contactId && (
                        <FormHelperText>{errors.contactId.message}</FormHelperText>
                      )}
                      <FormHelperText>
                        {!selectedClientId 
                          ? 'Select a client to load contacts' 
                          : 'Optional: Select a primary contact for this project'
                        }
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Box>

              {/* Project Type */}
              <Box>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: 'Project type is required' }}
                  render={({ field }: { field: any }) => (
                    <FormControl fullWidth required error={!!errors.type}>
                      <InputLabel>Project Type</InputLabel>
                      <Select
                        {...field}
                        label="Project Type"
                        startAdornment={<CategoryIcon sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        {projectTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.type && (
                        <FormHelperText>{errors.type.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Box>

              {/* Billing Type */}
              <Box>
                <Controller
                  name="billingType"
                  control={control}
                  rules={{ required: 'Billing type is required' }}
                  render={({ field }: { field: any }) => (
                    <FormControl fullWidth error={!!errors.billingType}>
                      <InputLabel>Billing Type</InputLabel>
                      <Select
                        {...field}
                        label="Billing Type"
                        startAdornment={<MoneyIcon sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        {billingTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.billingType && (
                        <FormHelperText>{errors.billingType.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Box>

              {/* Location */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Controller
                  name="location"
                  control={control}
                  rules={{ 
                    required: 'Location is required',
                    minLength: {
                      value: 5,
                      message: 'Location must be at least 5 characters'
                    }
                  }}
                  render={({ field }: { field: any }) => (
                    <TextField
                      {...field}
                      label="Location"
                      fullWidth
                      required
                      placeholder="e.g., 123 Main St, City, State"
                      error={!!errors.location}
                      helperText={errors.location?.message}
                      InputProps={{
                        startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  )}
                />
              </Box>

              {/* Description */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }: { field: any }) => (
                    <TextField
                      {...field}
                      label="Project Description"
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Describe the project scope, requirements, and any special considerations..."
                      error={!!errors.description}
                      helperText={errors.description?.message || 'Optional: Detailed description of the project'}
                    />
                  )}
                />
              </Box>

              {/* Start Date */}
              <Box>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: 'Start date is required' }}
                  render={({ field }: { field: any }) => (
                    <DatePicker
                      {...field}
                      label="Start Date"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          error: !!errors.startDate,
                          helperText: errors.startDate?.message,
                          InputProps: {
                            startAdornment: <CalendarIcon sx={{ mr: 1, color: 'action.active' }} />
                          }
                        }
                      }}
                    />
                  )}
                />
              </Box>

              {/* End Date */}
              <Box>
                <Controller
                  name="endDate"
                  control={control}
                  rules={{
                    validate: (value: any) => {
                      if (value && startDate && value < startDate) {
                        return 'End date must be after start date';
                      }
                      return true;
                    }
                  }}
                  render={({ field }: { field: any }) => (
                    <DatePicker
                      {...field}
                      label="End Date"
                      minDate={startDate || undefined}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.endDate,
                          helperText: errors.endDate?.message || 'Optional end date'
                        }
                      }}
                    />
                  )}
                />
              </Box>

              {/* Budget */}
              <Box>
                <Controller
                  name="budget"
                  control={control}
                  rules={{ 
                    required: 'Budget is required',
                    min: {
                      value: 0,
                      message: 'Budget must be a positive number'
                    }
                  }}
                  render={({ field }: { field: any }) => (
                    <TextField
                      {...field}
                      label="Budget"
                      type="number"
                      fullWidth
                      required
                      placeholder="0.00"
                      error={!!errors.budget}
                      helperText={errors.budget?.message}
                      InputProps={{
                        startAdornment: <MoneyIcon sx={{ mr: 1, color: 'action.active' }} />,
                        inputProps: { min: 0, step: 0.01 }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            {/* Form Actions */}
            <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={!isValid || isSubmitting || isLoading}
                sx={{ minWidth: 120 }}
              >
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default ProjectForm;
