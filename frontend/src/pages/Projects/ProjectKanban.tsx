import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useProjectStore } from '../../store';
import { Project } from '../../services/project.service';

// Status configuration
const statusConfig = {
  QUOTED: {
    label: 'Quoted',
    color: 'default' as const,
    bgColor: '#f5f5f5',
  },
  AWARDED: {
    label: 'Awarded',
    color: 'primary' as const,
    bgColor: '#e3f2fd',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'warning' as const,
    bgColor: '#fff3e0',
  },
  INSPECTION: {
    label: 'Inspection',
    color: 'info' as const,
    bgColor: '#e8f5e8',
  },
  COMPLETE: {
    label: 'Complete',
    color: 'success' as const,
    bgColor: '#e8f5e8',
  },
};

// Project card component
interface ProjectCardProps {
  project: Project;
  isDragging?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'No date';
    
    // Handle empty strings
    if (dateString.trim() === '') return 'No date';
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  // Format billing type
  const getBillingTypeLabel = (billingType: string) => {
    switch (billingType) {
      case 'TIME_AND_MATERIALS':
        return 'T&M';
      case 'LUMP_SUM':
        return 'Lump Sum';
      case 'SERVICE_CALL':
        return 'Service Call';
      default:
        return billingType;
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        sx={{
          cursor: 'grab',
          transition: 'all 0.2s ease',
          transform: isDragging || isSortableDragging ? 'rotate(2deg)' : 'none',
          boxShadow: isDragging || isSortableDragging ? 3 : 1,
          marginBottom: '8px',
          '&:hover': {
            boxShadow: 2,
          },
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Project Header */}
          <Box mb={2}>
            <Typography variant="h5" component="h3" noWrap sx={{ 
              fontWeight: 700, 
              color: 'primary.main',
              mb: 1
            }}>
              {project.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Chip
                label={`#${project.projectNumber}`}
                size="small"
                variant="filled"
                color="primary"
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}
              />
              <Chip
                label={getBillingTypeLabel(project.billingType)}
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          </Box>

          {/* Client Info */}
          <Box display="flex" alignItems="center" mb={1}>
            <BusinessIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {project.client?.name || 'No Client'}
            </Typography>
          </Box>

          {/* Location */}
          {project.location && (
            <Box display="flex" alignItems="center" mb={1}>
              <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {project.location}
              </Typography>
            </Box>
          )}

          {/* Budget */}
          {project.budget && (
            <Box display="flex" alignItems="center" mb={1}>
              <MoneyIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(project.budget)}
              </Typography>
            </Box>
          )}

          {/* Start Date */}
          {project.startDate && (
            <Box display="flex" alignItems="center" mb={1}>
              <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatDate(project.startDate)}
              </Typography>
            </Box>
          )}

          {/* Project Type and Billing Type */}
          <Box mt={1} display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={project.type}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Chip
              label={getBillingTypeLabel(project.billingType)}
              size="small"
              variant="outlined"
              color="secondary"
            />
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

// Status column component
interface StatusColumnProps {
  status: keyof typeof statusConfig;
  projects: Project[];
  title: string;
}

const StatusColumn: React.FC<StatusColumnProps> = ({ status, projects, title }) => {
  const config = statusConfig[status];
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <Box sx={{ minWidth: 300, maxWidth: 350 }}>
      <Paper
        ref={setNodeRef}
        elevation={1}
        sx={{
          p: 2,
          backgroundColor: isOver ? config.bgColor + '80' : config.bgColor,
          borderRadius: 2,
          height: 'fit-content',
          minHeight: 400,
          border: isOver ? '2px dashed' : '2px solid transparent',
          borderColor: isOver ? 'primary.main' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Column Header */}
        <Box display="flex" alignItems="center" mb={2}>
          <Chip
            label={title}
            color={config.color}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 1 }}
          >
            ({projects.length})
          </Typography>
        </Box>

        {/* Sortable Area */}
        <SortableContext
          items={projects.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box sx={{ minHeight: 200 }}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
              />
            ))}
          </Box>
        </SortableContext>
      </Paper>
    </Box>
  );
};

// Main Kanban component
const ProjectKanban: React.FC = () => {
  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const error = useProjectStore((state) => state.error);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const updateProject = useProjectStore((state) => state.updateProject);

  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    const status = project.status as keyof typeof statusConfig;
    // Only include projects with valid statuses
    if (statusConfig[status]) {
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(project);
    } else {
      console.warn(`Project ${project.name} has invalid status: ${project.status}`);
    }
    return acc;
  }, {} as Record<keyof typeof statusConfig, Project[]>);

  // Load projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Debug: Log projects data
  useEffect(() => {
    console.log('Projects in Kanban:', projects);
    console.log('Projects by status:', projectsByStatus);
    
    // Debug date values
    projects.forEach(project => {
      if (project.startDate) {
        console.log(`Project ${project.name} startDate:`, project.startDate, 'Type:', typeof project.startDate);
      }
      if (project.endDate) {
        console.log(`Project ${project.name} endDate:`, project.endDate, 'Type:', typeof project.endDate);
      }
    });
  }, [projects, projectsByStatus]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find(p => p.id === active.id);
    setActiveProject(project || null);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProject(null);

    if (!over) {
      return;
    }

    // Find the project being moved
    const project = projects.find(p => p.id === active.id);
    if (!project) {
      return;
    }

    // Get the target status directly from the over element
    const targetStatus = over.id as keyof typeof statusConfig;

    // Check if it's a valid status
    if (!statusConfig[targetStatus] || project.status === targetStatus) {
      return;
    }

    console.log(`Moving project ${project.name} from ${project.status} to ${targetStatus}`);

    try {
      // Update project status
      await updateProject(project.id, {
        status: targetStatus,
      });
      console.log('Project status updated successfully');
    } catch (error) {
      console.error('Error updating project status:', error);
      // You might want to show a toast notification here
    }
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
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Project Kanban Board
      </Typography>
      
      <Typography variant="body1" color="text.secondary" mb={3}>
        Drag and drop projects between columns to update their status
      </Typography>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          display="flex"
          gap={2}
          overflow="auto"
          pb={2}
          sx={{
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: 4,
            },
          }}
        >
          {Object.entries(statusConfig).map(([status, config]) => (
            <StatusColumn
              key={status}
              status={status as keyof typeof statusConfig}
              projects={projectsByStatus[status as keyof typeof statusConfig] || []}
              title={config.label}
            />
          ))}
        </Box>

        <DragOverlay>
          {activeProject ? (
            <ProjectCard project={activeProject} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
};

export default ProjectKanban;