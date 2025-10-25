import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Container,
  Skeleton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Assignment,
  Business,
  Description,
  PhotoCamera,
  AssignmentTurnedIn,
  Today,
  People,
  Settings,
  TrendingUp,
  Schedule,
  CheckCircle,
  Pending,
  AttachMoney,
  Person,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useThemeStore } from '../store';
import { useTheme } from '@mui/material/styles';

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  color: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  loading?: boolean;
}

interface RecentActivity {
  id: string;
  type: 'project' | 'client' | 'quote' | 'document' | 'photo' | 'log';
  action: string;
  description: string;
  timestamp: string;
  user: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, loading }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Skeleton variant="text" width="60%" />
          </Box>
          <Skeleton variant="text" width="40%" height={32} />
          <Skeleton variant="text" width="30%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.main}05 100%)`,
        border: `1px solid ${theme.palette.primary.main}20`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0px 8px 25px ${theme.palette.primary.main}30`,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 1 }}>
          {value}
        </Typography>
        {trend && (
          <Chip
            label={trend}
            size="small"
            sx={{
              backgroundColor: `${theme.palette.primary.main}20`,
              color: theme.palette.primary.main,
              fontWeight: 500,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

const ModuleCard: React.FC<ModuleCardProps> = ({ icon, title, description, path, color }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleOpen = () => {
    navigate(path);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0px 8px 25px ${theme.palette.primary.main}30`,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            lineHeight: 1.6,
            minHeight: '2.4em', // Ensures consistent card heights
          }}
        >
          {description}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          onClick={handleOpen}
          fullWidth
          sx={{
            backgroundColor: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          }}
        >
          Open
        </Button>
      </CardActions>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Mock data - in real app, this would come from API
  const stats = [
    {
      title: 'Total Projects',
      value: 24,
      icon: <Assignment />,
      color: theme.palette.primary.main,
      trend: '+12% this month',
    },
    {
      title: 'Active Projects',
      value: 8,
      icon: <TrendingUp />,
      color: theme.palette.primary.main,
      trend: '+2 this week',
    },
    {
      title: 'Pending Quotes',
      value: 5,
      icon: <Pending />,
      color: theme.palette.primary.main,
      trend: '3 due today',
    },
    {
      title: 'Total Revenue',
      value: '$125,430',
      icon: <AttachMoney />,
      color: theme.palette.primary.main,
      trend: '+8.5% vs last month',
    },
  ];

  const modules = [
    {
      icon: <Assignment fontSize="large" />,
      title: 'Projects',
      description: 'Manage construction projects, track progress, and oversee project timelines.',
      path: '/projects',
      color: theme.palette.primary.main,
    },
    {
      icon: <Business fontSize="large" />,
      title: 'Clients',
      description: 'View and manage client information, contact details, and project history.',
      path: '/clients',
      color: theme.palette.primary.main,
    },
    {
      icon: <Description fontSize="large" />,
      title: 'Quotes',
      description: 'Create, manage, and track project quotes and estimates for clients.',
      path: '/quotes',
      color: theme.palette.primary.main,
    },
    {
      icon: <Description fontSize="large" />,
      title: 'Documents',
      description: 'Store and organize project documents, plans, and important files.',
      path: '/documents',
      color: theme.palette.primary.main,
    },
    {
      icon: <PhotoCamera fontSize="large" />,
      title: 'Photos',
      description: 'Upload and manage project photos, progress images, and visual documentation.',
      path: '/photos',
      color: theme.palette.primary.main,
    },
    {
      icon: <Today fontSize="large" />,
      title: 'Daily Logs',
      description: 'Record daily activities, work progress, and field observations.',
      path: '/daily-logs',
      color: theme.palette.primary.main,
    },
    {
      icon: <People fontSize="large" />,
      title: 'Employees',
      description: 'Manage employee directory, job classifications, and contact information.',
      path: '/employees',
      color: theme.palette.primary.main,
    },
    {
      icon: <People fontSize="large" />,
      title: 'Users',
      description: 'Manage user accounts, roles, and permissions for team members.',
      path: '/admin/users',
      color: theme.palette.primary.main,
    },
    {
      icon: <Settings fontSize="large" />,
      title: 'Settings',
      description: 'Configure application settings, preferences, and user profile.',
      path: '/settings',
      color: theme.palette.primary.main,
    },
  ];

  // Mock recent activity data
  const mockRecentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'project',
      action: 'Project Updated',
      description: 'Downtown Office Building - Phase 2 completed',
      timestamp: '2 hours ago',
      user: 'John Smith',
    },
    {
      id: '2',
      type: 'quote',
      action: 'Quote Created',
      description: 'New quote for Industrial Warehouse project',
      timestamp: '4 hours ago',
      user: 'Sarah Johnson',
    },
    {
      id: '3',
      type: 'client',
      action: 'Client Added',
      description: 'ABC Construction Company added to system',
      timestamp: '6 hours ago',
      user: 'Mike Wilson',
    },
    {
      id: '4',
      type: 'photo',
      action: 'Photos Uploaded',
      description: '15 progress photos added to Mall Renovation',
      timestamp: '1 day ago',
      user: 'Lisa Brown',
    },
    {
      id: '5',
      type: 'log',
      action: 'Daily Log',
      description: 'Field work completed on Hospital Extension',
      timestamp: '1 day ago',
      user: 'Tom Davis',
    },
  ];

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setRecentActivity(mockRecentActivity);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Assignment />;
      case 'client':
        return <Business />;
      case 'quote':
        return <Description />;
      case 'document':
        return <Description />;
      case 'photo':
        return <PhotoCamera />;
      case 'log':
        return <Today />;
      default:
        return <AccessTime />;
    }
  };

  const getActivityColor = (type: string) => {
    // Use theme colors instead of hardcoded colors
    return theme.palette.primary.main;
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.first_name || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your projects today.
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Overview
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              trend={stat.trend}
              loading={loading}
            />
          ))}
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr',
          },
          gap: 4,
          mb: 4,
        }}
      >
        {/* Modules Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Quick Access
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(2, 1fr)',
              },
              gap: 3,
            }}
          >
            {modules.map((module, index) => (
              <ModuleCard
                key={index}
                icon={module.icon}
                title={module.title}
                description={module.description}
                path={module.path}
                color={module.color}
              />
            ))}
          </Box>
        </Box>

        {/* Recent Activity Section */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Recent Activity
          </Typography>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            {loading ? (
              <Box>
                {[...Array(5)].map((_, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                      <Skeleton variant="text" width="60%" />
                    </Box>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                ))}
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: getActivityColor(activity.type),
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {activity.action}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Person sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                                {activity.user}
                              </Typography>
                              <AccessTime sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {activity.timestamp}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;