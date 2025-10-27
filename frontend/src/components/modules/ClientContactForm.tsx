/**
 * Client Contact Form Component
 * 
 * A form for creating and editing client contacts with validation and error handling.
 * Supports all contact fields including primary contact management.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { clientContactService, ClientContact, CreateClientContactData, UpdateClientContactData } from '../../services/client-contact.service';

export interface ClientContactFormProps {
  clientId: string;
  contact?: ClientContact | null;
  onSave?: (contact: ClientContact) => void;
  onCancel?: () => void;
  loading?: boolean;
  open?: boolean;
  className?: string;
}

/**
 * Client Contact Form Component
 */
export const ClientContactForm: React.FC<ClientContactFormProps> = ({
  clientId,
  contact,
  onSave,
  onCancel,
  loading = false,
  open = false,
  className,
}) => {
  const [formData, setFormData] = useState<Omit<CreateClientContactData, 'client_id'>>({
    name: '',
    title: '',
    phone: '',
    email: '',
    is_primary: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        title: contact.title || '',
        phone: contact.phone || '',
        email: contact.email || '',
        is_primary: contact.is_primary || false,
      });
    } else {
      setFormData({
        name: '',
        title: '',
        phone: '',
        email: '',
        is_primary: false,
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [contact]);

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contact name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let response;
      if (contact) {
        // Update existing contact
        const updateData: UpdateClientContactData = { ...formData };
        response = await clientContactService.update(clientId, contact.id, updateData);
      } else {
        // Create new contact
        const createData: CreateClientContactData = { 
          ...formData, 
          client_id: clientId 
        };
        response = await clientContactService.create(createData);
      }

      if (response.success && response.data) {
        if (onSave) {
          onSave(response.data);
        }
      } else {
        throw new Error(response.message || 'Failed to save contact');
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to save contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const formContent = (
    <Box className={className}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Contact Name *"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading || isSubmitting}
              />

              <TextField
                fullWidth
                label="Title/Position"
                value={formData.title}
                onChange={handleInputChange('title')}
                disabled={loading || isSubmitting}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                disabled={loading || isSubmitting}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                disabled={loading || isSubmitting}
              />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_primary}
                    onChange={handleInputChange('is_primary')}
                    disabled={loading || isSubmitting}
                  />
                }
                label="Primary Contact"
              />
              <Typography variant="body2" color="text.secondary">
                Only one contact can be set as primary per client
              </Typography>
            </Box>
          </Box>

          {/* Error Alert */}
          {submitError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {submitError}
            </Alert>
          )}

          {/* Form Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );

  if (open) {
    return (
      <Dialog
        open={open}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle>
          {contact ? 'Edit Contact' : 'Add New Contact'}
        </DialogTitle>
        <DialogContent>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return formContent;
};

export default ClientContactForm;
