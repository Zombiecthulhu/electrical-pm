import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../../store';
import { Project, ProjectMember } from '../../services/project.service';
import { useNotification } from '../../hooks';

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'QUOTED':
      return 'default';
    case 'AWARDED':
      return 'primary';
    case 'IN_PROGRESS':
      return 'warning';
    case 'INSPECTION':
      return 'info';
    case 'COMPLETE':
      return 'success';
    default:
      return 'default';
  }
};

// Status icon mapping
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'QUOTED':
      return <InfoIcon />;
    case 'AWARDED':
      return <CheckCircleIcon />;
    case 'IN_PROGRESS':
      return <TimelineIcon />;
    case 'INSPECTION':
      return <WarningIcon />;
    case 'COMPLETE':
      return <CheckCircleIcon />;
    default:
      return <InfoIcon />;
  }
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format percentage
const formatPercentage = (value: number, total: number) => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success: showSuccess, error: showError } = useNotification();
  
  // Store state
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const isLoading = useProjectStore((state) => state.isLoading);
  const error = useProjectStore((state) => state.error);
  const fetchProject = useProjectStore((state) => state.fetchProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const clearError = useProjectStore((state) => state.clearError);

  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  // Load project data
  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id, fetchProject]);

  // Load team members and activity log (mock data for now)
  useEffect(() => {
    if (selectedProject) {
      // Mock team members data
      setTeamMembers([
        {
          id: '1',
          userId: '1',
          projectId: selectedProject.id,
          role: 'Project Manager',
          user: {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
          },
        },
        {
          id: '2',
          userId: '2',
          projectId: selectedProject.id,
          role: 'Electrician',
          user: {
            id: '2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
          },
        },
      ]);

      // Mock activity log data
      setActivityLog([
        {
          id: '1',
          action: 'Project Created',
          description: 'Project was created and assigned to team',
          timestamp: selectedProject.createdAt,
          user: 'System',
        },
        {
          id: '2',
          action: 'Status Changed',
          description: `Status changed from QUOTED to ${selectedProject.status}`,
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          user: 'John Doe',
        },
        {
          id: '3',
          action: 'Team Member Added',
          description: 'Jane Smith was added to the project team',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          user: 'John Doe',
        },
      ]);
    }
  }, [selectedProject]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (id) {
      try {
        await deleteProject(id);
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedProject || !newStatus) return;
    
    try {
      const updatedProject = await updateProject(selectedProject.id, {
        status: newStatus as any,
      });
      
      if (updatedProject) {
        showSuccess('Project status updated successfully');
        setStatusChangeDialogOpen(false);
        setNewStatus('');
      } else {
        showError('Failed to update project status');
      }
    } catch (error) {
      console.error('Failed to update project status:', error);
      showError('Failed to update project status');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/projects');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={clearError}>
            Dismiss
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!selectedProject) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Project not found
        </Alert>
      </Box>
    );
  }

  const project = selectedProject;
  const budget = project.budget || 0;
  const actualCost = project.actualCost || 0;
  const budgetVariance = actualCost - budget;
  const budgetVariancePercentage = budget > 0 ? (budgetVariance / budget) * 100 : 0;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flexGrow={1}>
          <Typography variant="h4" component="h1" gutterBottom>
            {project.name}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body1" color="text.secondary">
              Project #{project.projectNumber}
            </Typography>
            <Chip
              icon={getStatusIcon(project.status)}
              label={project.status.replace('_', ' ')}
              color={getStatusColor(project.status) as any}
              variant="filled"
            />
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Status Change Button */}
      <Box mb={3}>
        <Button
          variant="contained"
          onClick={() => {
            setNewStatus(selectedProject?.status || '');
            setStatusChangeDialogOpen(true);
          }}
          sx={{ mb: 2 }}
        >
          Change Status
        </Button>
      </Box>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project detail tabs">
            <Tab label="Overview" />
            <Tab label="Team" />
            <Tab label="Financial" />
            <Tab label="Activity" />
            <Tab label="Files" icon={<FolderIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3 
          }}>
            <Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Information
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <BusinessIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Type:
                      </Typography>
                      <Typography variant="body2">
                        {project.type || 'Not specified'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Location:
                      </Typography>
                      <Typography variant="body2">
                        {project.location || 'Not specified'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Start Date:
                      </Typography>
                      <Typography variant="body2">
                        {project.startDate ? formatDate(project.startDate) : 'Not set'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon color="action" />
                      <Typography variant="body2" color="text.secondary">
                        End Date:
                      </Typography>
                      <Typography variant="body2">
                        {project.endDate ? formatDate(project.endDate) : 'Not set'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Financial Summary
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Budget:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(budget)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Actual Cost:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(actualCost)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Variance:
                      </Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={budgetVariance >= 0 ? 'error.main' : 'success.main'}
                      >
                        {formatCurrency(budgetVariance)} ({formatPercentage(Math.abs(budgetVariancePercentage), 100)})
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(project.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated: {formatDate(project.updatedAt)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Team Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Team Members ({teamMembers.length})
            </Typography>
            <Button variant="outlined" size="small">
              Add Member
            </Button>
          </Box>
          
          <List>
            {teamMembers.map((member) => (
              <ListItem key={member.id} divider>
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${member.user.first_name} ${member.user.last_name}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {member.role}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {member.user.email}
                      </Typography>
                    </Box>
                  }
                />
                <Chip
                  label={member.role}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Financial Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3 
          }}>
            <Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Budget Overview
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total Budget:
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(budget)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Spent:
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(actualCost)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Remaining:
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(budget - actualCost)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Budget Performance
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Budget Utilization
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box flexGrow={1} height={8} bgcolor="grey.200" borderRadius={1}>
                          <Box
                            height="100%"
                            bgcolor={budgetVariancePercentage > 0 ? 'error.main' : 'success.main'}
                            borderRadius={1}
                            width={`${Math.min(100, Math.max(0, (actualCost / budget) * 100))}%`}
                          />
                        </Box>
                        <Typography variant="body2">
                          {formatPercentage(actualCost, budget)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Variance
                      </Typography>
                      <Typography 
                        variant="h6"
                        color={budgetVariance >= 0 ? 'error.main' : 'success.main'}
                      >
                        {budgetVariance >= 0 ? '+' : ''}{formatCurrency(budgetVariance)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Activity Log
          </Typography>
          
          <List>
            {activityLog.map((activity, index) => (
              <ListItem key={activity.id} divider={index < activityLog.length - 1}>
                <ListItemAvatar>
                  <Avatar>
                    <AssignmentIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={activity.action}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(activity.timestamp)} • {activity.user}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Files Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Files
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Manage documents, photos, and other files for this project.
            </Typography>
            <Button
              variant="contained"
              startIcon={<FolderIcon />}
              onClick={() => navigate(`/projects/${project.id}/files`)}
              sx={{ mb: 2 }}
            >
              Open File Manager
            </Button>
            <Typography variant="body2" color="text.secondary">
              Click the button above to access the full file management interface where you can upload, organize, and manage all project files.
            </Typography>
          </Box>
        </TabPanel>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Project
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{project.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusChangeDialogOpen}
        onClose={() => setStatusChangeDialogOpen(false)}
        aria-labelledby="status-change-dialog-title"
      >
        <DialogTitle id="status-change-dialog-title">
          Change Project Status
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
            >
              <MenuItem value="QUOTED">Quoted</MenuItem>
              <MenuItem value="AWARDED">Awarded</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="INSPECTION">Inspection</MenuItem>
              <MenuItem value="COMPLETE">Complete</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStatusChange} variant="contained">
            Change Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetail;