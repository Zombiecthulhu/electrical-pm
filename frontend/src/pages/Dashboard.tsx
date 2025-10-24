import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
} from '@mui/material';
import { useAuthStore } from '../store';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Welcome back, {user?.first_name} {user?.last_name}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Role: {user?.role} | Email: {user?.email}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Access your most frequently used features and tools.
              </Typography>
              <Button variant="contained" sx={{ mr: 2 }}>
                View Projects
              </Button>
              <Button variant="outlined">
                Manage Clients
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your latest project updates and notifications.
              </Typography>
              <Typography variant="body2">
                No recent activity to display.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Management
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your account settings and preferences.
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
