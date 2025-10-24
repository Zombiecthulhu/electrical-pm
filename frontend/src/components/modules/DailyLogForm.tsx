/**
 * Daily Log Form Component
 * 
 * A comprehensive form for creating and editing daily logs with all required fields
 * for construction daily reports including weather, crew, work performed, materials, etc.
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
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { DailyLog, CreateDailyLogData, UpdateDailyLogData } from '../../services/daily-log.service';
import { projectService, Project } from '../../services/project.service';

// Form data interface
interface DailyLogFormData {
  projectId: string;
  date: Date | null;
  weather: string;
  workPerformed: string;
  equipmentUsed: string;
  issues: string;
  inspectorVisit: string;
  crewMembers: Array<{
    name: string;
    role: string;
    hours: number;
  }>;
  materialsUsed: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
}

// Default form values
const defaultValues: DailyLogFormData = {
  projectId: '',
  date: new Date(),
  weather: '',
  workPerformed: '',
  equipmentUsed: '',
  issues: '',
  inspectorVisit: '',
  crewMembers: [{ name: '', role: '', hours: 8 }],
  materialsUsed: [{ name: '', quantity: '', unit: '' }],
};

// Weather options
const weatherOptions = [
  'Sunny',
  'Partly Cloudy',
  'Cloudy',
  'Overcast',
  'Rainy',
  'Stormy',
  'Snowy',
  'Foggy',
  'Windy',
  'Hot',
  'Cold',
];

// Role options
const roleOptions = [
  'Foreman',
  'Electrician',
  'Apprentice',
  'Helper',
  'Supervisor',
  'Inspector',
  'Safety Officer',
  'Other',
];

// Material unit options
const unitOptions = [
  'ft',
  'in',
  'lbs',
  'kg',
  'pcs',
  'rolls',
  'boxes',
  'sheets',
  'gallons',
  'liters',
  'other',
];

interface DailyLogFormProps {
  dailyLog?: DailyLog | null;
  onSave: (data: CreateDailyLogData | UpdateDailyLogData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DailyLogForm: React.FC<DailyLogFormProps> = ({
  dailyLog,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<DailyLogFormData>({
    defaultValues,
    mode: 'onChange',
  });

  // Field arrays for dynamic fields
  const {
    fields: crewFields,
    append: appendCrewMember,
    remove: removeCrewMember,
  } = useFieldArray({
    control,
    name: 'crewMembers',
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
  } = useFieldArray({
    control,
    name: 'materialsUsed',
  });

  // Load projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectsError(null);
        const response = await projectService.getAll();
        if (response.success) {
          setProjects(response.data.projects);
        } else {
          setProjectsError('Failed to load projects');
        }
      } catch (error: any) {
        console.error('Error fetching projects:', error);
        setProjectsError(error.message || 'Failed to load projects');
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Reset form when dailyLog changes
  useEffect(() => {
    if (dailyLog) {
      reset({
        projectId: dailyLog.projectId,
        date: new Date(dailyLog.date),
        weather: dailyLog.weather || '',
        workPerformed: dailyLog.workPerformed,
        equipmentUsed: dailyLog.equipmentUsed || '',
        issues: dailyLog.issues || '',
        inspectorVisit: dailyLog.inspectorVisit || '',
        crewMembers: dailyLog.crewMembers || [{ name: '', role: '', hours: 8 }],
        materialsUsed: dailyLog.materialsUsed || [{ name: '', quantity: '', unit: '' }],
      });
    } else {
      reset(defaultValues);
    }
  }, [dailyLog]); // Remove reset from dependencies

  // Handle form submission
  const onSubmit = (data: DailyLogFormData) => {
    const formData = {
      projectId: data.projectId,
      date: data.date?.toISOString().split('T')[0] || '',
      weather: data.weather || undefined,
      workPerformed: data.workPerformed,
      equipmentUsed: data.equipmentUsed || undefined,
      issues: data.issues || undefined,
      inspectorVisit: data.inspectorVisit || undefined,
      crewMembers: data.crewMembers.filter(member => member.name.trim() !== ''),
      materialsUsed: data.materialsUsed.filter(material => material.name.trim() !== ''),
    };

    onSave(formData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon color="primary" />
            {dailyLog ? 'Edit Daily Log' : 'Create Daily Log'}
          </Typography>

          {/* Project Selection */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="projectId"
              control={control}
              rules={{ required: 'Project selection is required' }}
              render={({ field }) => (
                <FormControl fullWidth required error={!!errors.projectId}>
                  <InputLabel>Project</InputLabel>
                  <Select
                    {...field}
                    label="Project"
                    disabled={projectsLoading || isLoading}
                  >
                    {projectsLoading ? (
                      <MenuItem disabled>Loading projects...</MenuItem>
                    ) : projectsError ? (
                      <MenuItem disabled>Error loading projects</MenuItem>
                    ) : projects.length === 0 ? (
                      <MenuItem disabled>No projects available</MenuItem>
                    ) : (
                      projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name} ({project.projectNumber})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.projectId && (
                    <FormHelperText>{errors.projectId.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Box>

          {/* Date and Weather */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2, mb: 3 }}>
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Date"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.date,
                      helperText: errors.date?.message,
                    }
                  }}
                />
              )}
            />

            <Controller
              name="weather"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Weather</InputLabel>
                  <Select
                    {...field}
                    label="Weather"
                    disabled={isLoading}
                  >
                    {weatherOptions.map((weather) => (
                      <MenuItem key={weather} value={weather}>
                        {weather}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Box>

          {/* Work Performed */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="workPerformed"
              control={control}
              rules={{ 
                required: 'Work performed is required',
                minLength: {
                  value: 10,
                  message: 'Work performed must be at least 10 characters'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Work Performed"
                  fullWidth
                  required
                  multiline
                  rows={4}
                  placeholder="Describe the work performed today..."
                  error={!!errors.workPerformed}
                  helperText={errors.workPerformed?.message}
                />
              )}
            />
          </Box>

          {/* Equipment Used */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="equipmentUsed"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Equipment Used"
                  fullWidth
                  placeholder="List any equipment, tools, or machinery used..."
                  error={!!errors.equipmentUsed}
                  helperText={errors.equipmentUsed?.message}
                />
              )}
            />
          </Box>

          {/* Crew Members */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GroupIcon color="primary" />
              Crew Members
            </Typography>
            
            {crewFields.map((field, index) => (
              <Box key={field.id} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 2, mb: 2, alignItems: 'start' }}>
                <Controller
                  name={`crewMembers.${index}.name`}
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Name"
                      fullWidth
                      required
                      error={!!errors.crewMembers?.[index]?.name}
                      helperText={errors.crewMembers?.[index]?.name?.message}
                    />
                  )}
                />
                
                <Controller
                  name={`crewMembers.${index}.role`}
                  control={control}
                  rules={{ required: 'Role is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.crewMembers?.[index]?.role}>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        {roleOptions.map((role) => (
                          <MenuItem key={role} value={role}>
                            {role}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                
                <Controller
                  name={`crewMembers.${index}.hours`}
                  control={control}
                  rules={{ 
                    required: 'Hours is required',
                    min: { value: 0, message: 'Hours must be positive' },
                    max: { value: 24, message: 'Hours cannot exceed 24' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Hours"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 0, max: 24, step: 0.5 }}
                      error={!!errors.crewMembers?.[index]?.hours}
                      helperText={errors.crewMembers?.[index]?.hours?.message}
                    />
                  )}
                />
                
                <IconButton
                  onClick={() => removeCrewMember(index)}
                  disabled={crewFields.length === 1}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={() => appendCrewMember({ name: '', role: '', hours: 8 })}
              disabled={isLoading}
            >
              Add Crew Member
            </Button>
          </Box>

          {/* Materials Used */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon color="primary" />
              Materials Used
            </Typography>
            
            {materialFields.map((field, index) => (
              <Box key={field.id} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 2, mb: 2, alignItems: 'start' }}>
                <Controller
                  name={`materialsUsed.${index}.name`}
                  control={control}
                  rules={{ required: 'Material name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Material Name"
                      fullWidth
                      required
                      error={!!errors.materialsUsed?.[index]?.name}
                      helperText={errors.materialsUsed?.[index]?.name?.message}
                    />
                  )}
                />
                
                <Controller
                  name={`materialsUsed.${index}.quantity`}
                  control={control}
                  rules={{ required: 'Quantity is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity"
                      fullWidth
                      required
                      error={!!errors.materialsUsed?.[index]?.quantity}
                      helperText={errors.materialsUsed?.[index]?.quantity?.message}
                    />
                  )}
                />
                
                <Controller
                  name={`materialsUsed.${index}.unit`}
                  control={control}
                  rules={{ required: 'Unit is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.materialsUsed?.[index]?.unit}>
                      <InputLabel>Unit</InputLabel>
                      <Select {...field} label="Unit">
                        {unitOptions.map((unit) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
                
                <IconButton
                  onClick={() => removeMaterial(index)}
                  disabled={materialFields.length === 1}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            
            <Button
              startIcon={<AddIcon />}
              onClick={() => appendMaterial({ name: '', quantity: '', unit: '' })}
              disabled={isLoading}
            >
              Add Material
            </Button>
          </Box>

          {/* Issues */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="issues"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Issues or Problems"
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Describe any issues, problems, or delays encountered..."
                  error={!!errors.issues}
                  helperText={errors.issues?.message}
                />
              )}
            />
          </Box>

          {/* Inspector Visit */}
          <Box sx={{ mb: 3 }}>
            <Controller
              name="inspectorVisit"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Inspector Visit"
                  fullWidth
                  placeholder="Note any inspector visits or inspections performed..."
                  error={!!errors.inspectorVisit}
                  helperText={errors.inspectorVisit?.message}
                />
              )}
            />
          </Box>

          {/* Form Actions */}
          <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
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
              sx={{ minWidth: 120 }}
            >
              {isLoading ? 'Saving...' : dailyLog ? 'Update Log' : 'Create Log'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default DailyLogForm;
