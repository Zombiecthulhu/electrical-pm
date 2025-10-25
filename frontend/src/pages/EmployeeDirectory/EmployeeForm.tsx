/**
 * Employee Form Component
 * 
 * Form for creating and editing employees
 * Mobile-optimized: Single column layout, touch-friendly, prevents iOS zoom
 */

import React, { useState, useEffect } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import {
  ResponsiveFormWrapper,
  FormRow,
  FormSection,
  FormActions,
  mobileFormFieldProps,
} from '../../components/common';
import { Employee, CreateEmployeeData } from '../../services/employee.service';

// Common job classifications
const JOB_CLASSIFICATIONS = [
  'Electrician',
  'Master Electrician',
  'Journeyman Electrician',
  'Apprentice Electrician',
  'Foreman',
  'Project Manager',
  'Estimator',
  'Office Manager',
  'Administrative Assistant',
  'Safety Officer',
  'Quality Control',
  'Warehouse Manager',
  'Driver',
  'Helper',
  'Other',
];

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  classification: string;
  employeeNumber?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  department?: string;
  notes?: string;
}

interface EmployeeFormProps {
  employee?: Employee | null;
  onSave: (data: CreateEmployeeData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const isEdit = Boolean(employee);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<EmployeeFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      classification: '',
      employeeNumber: '',
      email: '',
      phone: '',
      mobilePhone: '',
      department: '',
      notes: '',
    },
    mode: 'onChange',
  });

  // Initialize form with employee data if editing
  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        classification: employee.classification || '',
        employeeNumber: employee.employeeNumber || '',
        email: employee.email || '',
        phone: employee.phone || '',
        mobilePhone: employee.mobilePhone || '',
        department: employee.department || '',
        notes: employee.notes || '',
      });
    }
  }, [employee, reset]);

  // Handle form submission
  const onSubmit = async (data: EmployeeFormData) => {
    setSubmitError(null);

    try {
      const employeeData: CreateEmployeeData = {
        firstName: data.firstName,
        lastName: data.lastName,
        classification: data.classification,
        employeeNumber: data.employeeNumber || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        mobilePhone: data.mobilePhone || undefined,
        department: data.department || undefined,
        notes: data.notes || undefined,
      };

      await onSave(employeeData);
    } catch (error: any) {
      console.error('Error saving employee:', error);
      setSubmitError(error.message || 'Failed to save employee');
    }
  };

  return (
    <ResponsiveFormWrapper
      title={isEdit ? 'Edit Employee' : 'Add New Employee'}
      subtitle={isEdit ? 'Update employee information' : 'Enter employee details'}
      maxWidth="md"
    >
      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Section 1: Basic Information */}
        <FormSection
          title="Basic Information"
          subtitle="Employee name and job role"
        >
          <FormRow columns={2}>
            {/* First Name */}
            <Controller
              name="firstName"
              control={control}
              rules={{
                required: 'First name is required',
                minLength: {
                  value: 2,
                  message: 'First name must be at least 2 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First Name"
                  required
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  {...mobileFormFieldProps}
                />
              )}
            />

            {/* Last Name */}
            <Controller
              name="lastName"
              control={control}
              rules={{
                required: 'Last name is required',
                minLength: {
                  value: 2,
                  message: 'Last name must be at least 2 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last Name"
                  required
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  {...mobileFormFieldProps}
                />
              )}
            />
          </FormRow>

          <FormRow columns={2}>
            {/* Classification */}
            <Controller
              name="classification"
              control={control}
              rules={{ required: 'Job classification is required' }}
              render={({ field }) => (
                <FormControl
                  required
                  error={!!errors.classification}
                  {...mobileFormFieldProps}
                >
                  <InputLabel>Job Classification</InputLabel>
                  <Select {...field} label="Job Classification">
                    {JOB_CLASSIFICATIONS.map((classification) => (
                      <MenuItem key={classification} value={classification}>
                        {classification}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.classification && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {errors.classification.message}
                    </Alert>
                  )}
                </FormControl>
              )}
            />

            {/* Employee Number */}
            <Controller
              name="employeeNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Employee Number"
                  placeholder="e.g., EMP001"
                  helperText="Optional unique identifier"
                  {...mobileFormFieldProps}
                />
              )}
            />
          </FormRow>
        </FormSection>

        {/* Section 2: Contact Information */}
        <FormSection
          title="Contact Information"
          subtitle="Email, phone numbers, and department (optional)"
        >
          <FormRow columns={1}>
            {/* Email */}
            <Controller
              name="email"
              control={control}
              rules={{
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  placeholder="employee@company.com"
                  error={!!errors.email}
                  helperText={errors.email?.message || 'Optional'}
                  {...mobileFormFieldProps}
                />
              )}
            />
          </FormRow>

          <FormRow columns={2}>
            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone"
                  placeholder="(555) 123-4567"
                  helperText="Optional"
                  {...mobileFormFieldProps}
                />
              )}
            />

            {/* Mobile Phone */}
            <Controller
              name="mobilePhone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mobile Phone"
                  placeholder="(555) 987-6543"
                  helperText="Optional"
                  {...mobileFormFieldProps}
                />
              )}
            />
          </FormRow>

          <FormRow columns={1}>
            {/* Department */}
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Department"
                  placeholder="e.g., Field Operations, Office, Warehouse"
                  helperText="Optional"
                  {...mobileFormFieldProps}
                />
              )}
            />
          </FormRow>
        </FormSection>

        {/* Section 3: Notes */}
        <FormSection title="Notes" subtitle="Additional information (optional)">
          <FormRow columns={1}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Notes"
                  multiline
                  rows={4}
                  placeholder="Additional notes, qualifications, or comments..."
                  helperText="Optional"
                  {...mobileFormFieldProps}
                />
              )}
            />
          </FormRow>
        </FormSection>

        {/* Form Actions */}
        <FormActions>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
          </Button>
        </FormActions>
      </form>
    </ResponsiveFormWrapper>
  );
};

export default EmployeeForm;

