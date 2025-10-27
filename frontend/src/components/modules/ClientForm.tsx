/**
 * Client Form Component
 * 
 * A form for creating and editing clients with validation and error handling.
 * Supports all client fields including type selection and contact information.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { clientService, Client, CreateClientData, UpdateClientData } from '../../services/client.service';

export interface ClientFormProps {
  client?: Client | null;
  onSave?: (client: Client) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * Client Form Component
 */
export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSave,
  onCancel,
  loading = false,
  className,
}) => {
  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    type: 'OTHER',
    address: '',
    phone: '',
    email: '',
    website: '',
    tax_id: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        type: client.type || 'OTHER',
        address: client.address || '',
        phone: client.phone || '',
        email: client.email || '',
        website: client.website || '',
        tax_id: client.tax_id || '',
        notes: client.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: 'OTHER',
        address: '',
        phone: '',
        email: '',
        website: '',
        tax_id: '',
        notes: '',
      });
    }
    setErrors({});
    setSubmitError(null);
  }, [client]);

  // Handle input changes
  const handleInputChange = (field: keyof CreateClientData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
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
      newErrors.name = 'Client name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (include http:// or https://)';
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
      if (client) {
        // Update existing client
        const updateData: UpdateClientData = { ...formData };
        response = await clientService.update(client.id, updateData);
      } else {
        // Create new client
        response = await clientService.create(formData);
      }

      if (response.success && response.data) {
        if (onSave) {
          onSave(response.data);
        }
      } else {
        throw new Error(response.message || 'Failed to save client');
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to save client');
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

  return (
    <Box className={className}>
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5">
            {client ? 'Edit Client' : 'Add New Client'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Basic Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Client Name *"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading || isSubmitting}
              />

              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>Client Type *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleInputChange('type')}
                  label="Client Type *"
                  disabled={loading || isSubmitting}
                >
                  <MenuItem value="GENERAL_CONTRACTOR">General Contractor</MenuItem>
                  <MenuItem value="DEVELOPER">Developer</MenuItem>
                  <MenuItem value="HOMEOWNER">Homeowner</MenuItem>
                  <MenuItem value="COMMERCIAL">Commercial</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Contact Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact Information
              </Typography>
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Address"
                value={formData.address}
                onChange={handleInputChange('address')}
                multiline
                rows={2}
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Website"
                value={formData.website}
                onChange={handleInputChange('website')}
                error={!!errors.website}
                helperText={errors.website || 'Include http:// or https://'}
                disabled={loading || isSubmitting}
              />

              <TextField
                fullWidth
                label="Tax ID"
                value={formData.tax_id}
                onChange={handleInputChange('tax_id')}
                disabled={loading || isSubmitting}
              />
            </Box>

            {/* Additional Information */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Additional Information
              </Typography>
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                multiline
                rows={4}
                disabled={loading || isSubmitting}
              />
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
              {isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ClientForm;
