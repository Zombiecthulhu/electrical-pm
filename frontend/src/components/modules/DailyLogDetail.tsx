/**
 * Daily Log Detail Component
 * 
 * Displays detailed information about a single daily log with all fields
 * and related information for construction daily reports.
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Button,
  IconButton,
} from '@mui/material';
import {
  Work as WorkIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CloudQueue as WeatherIcon,
  Assignment as AssignmentIcon,
  Engineering as EngineeringIcon,
} from '@mui/icons-material';
import { DailyLog } from '../../services/daily-log.service';
import { format } from 'date-fns';

interface DailyLogDetailProps {
  dailyLog: DailyLog | null;
  isLoading?: boolean;
  error?: string | null;
  onEdit?: (dailyLog: DailyLog) => void;
  onDelete?: (dailyLog: DailyLog) => void;
  onBack?: () => void;
}

const DailyLogDetail: React.FC<DailyLogDetailProps> = ({
  dailyLog,
  isLoading = false,
  error = null,
  onEdit,
  onDelete,
  onBack,
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch {
      return '';
    }
  };

  // Get weather chip color
  const getWeatherChipColor = (weather: string | null) => {
    if (!weather) return 'default';
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('sunny') || weatherLower.includes('hot')) return 'success';
    if (weatherLower.includes('cloudy') || weatherLower.includes('overcast')) return 'default';
    if (weatherLower.includes('rainy') || weatherLower.includes('stormy') || weatherLower.includes('snowy')) return 'error';
    if (weatherLower.includes('windy') || weatherLower.includes('foggy')) return 'warning';
    return 'default';
  };

  // Calculate total hours worked
  const calculateTotalHours = (crewMembers: any[] | null | undefined) => {
    if (!crewMembers || crewMembers.length === 0) return 0;
    return crewMembers.reduce((total, member) => total + (member.hours || 0), 0);
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="400px" gap={2}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading daily log...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!dailyLog) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No daily log found.
      </Alert>
    );
  }

  const totalHours = calculateTotalHours(dailyLog.crewMembers);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          {onBack && (
            <IconButton onClick={onBack} color="primary">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon color="primary" />
              Daily Log
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {dailyLog.project?.name} - {formatDate(dailyLog.date)}
            </Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={1}>
          {onEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => onEdit(dailyLog)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(dailyLog)}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* Project Information */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="primary" />
                Project Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Project Name"
                    secondary={dailyLog.project?.name || 'Unknown Project'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Project Number"
                    secondary={dailyLog.project?.projectNumber || 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Date"
                    secondary={formatDate(dailyLog.date)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Created"
                    secondary={`${formatDate(dailyLog.createdAt)} at ${formatTime(dailyLog.createdAt)}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Updated"
                    secondary={`${formatDate(dailyLog.updatedAt)} at ${formatTime(dailyLog.updatedAt)}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Weather and Conditions */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WeatherIcon color="primary" />
                Weather & Conditions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Weather
                  </Typography>
                  {dailyLog.weather ? (
                    <Chip
                      label={dailyLog.weather}
                      color={getWeatherChipColor(dailyLog.weather) as any}
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not specified
                    </Typography>
                  )}
                </Box>
                
                {dailyLog.equipmentUsed && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Equipment Used
                    </Typography>
                    <Typography variant="body2">
                      {dailyLog.equipmentUsed}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Work Performed */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkIcon color="primary" />
                Work Performed
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {dailyLog.workPerformed}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Crew Members */}
        {dailyLog.crewMembers && dailyLog.crewMembers.length > 0 && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon color="primary" />
                  Crew Members
                  <Chip 
                    label={`${dailyLog.crewMembers.length} member${dailyLog.crewMembers.length > 1 ? 's' : ''}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Typography>
                <List dense>
                  {dailyLog.crewMembers.map((member, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <PersonIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={member.name}
                        secondary={`${member.role} - ${member.hours} hours`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Hours: {totalHours}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Materials Used */}
        {dailyLog.materialsUsed && dailyLog.materialsUsed.length > 0 && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BuildIcon color="primary" />
                  Materials Used
                  <Chip 
                    label={`${dailyLog.materialsUsed.length} item${dailyLog.materialsUsed.length > 1 ? 's' : ''}`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Typography>
                <List dense>
                  {dailyLog.materialsUsed.map((material, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <EngineeringIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={material.name}
                        secondary={`${material.quantity} ${material.unit}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Issues */}
        {dailyLog.issues && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  Issues or Problems
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {dailyLog.issues}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Inspector Visit */}
        {dailyLog.inspectorVisit && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon color="primary" />
                  Inspector Visit
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {dailyLog.inspectorVisit}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Created By */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                Created By
              </Typography>
              <Typography variant="body1">
                {dailyLog.creator ? 
                  `${dailyLog.creator.firstName} ${dailyLog.creator.lastName}` : 
                  'Unknown User'
                }
                {dailyLog.creator?.email && (
                  <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                    ({dailyLog.creator.email})
                  </Typography>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default DailyLogDetail;
