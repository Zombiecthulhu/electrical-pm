import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Button, Alert } from '@mui/material';
import theme from './theme';
import { api, ApiResponse } from './services';
import { useAuth } from './store';

function App() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');
  
  // Zustand auth store
  const { user, isAuthenticated, isLoading, error, login, logout, checkAuth, clearError } = useAuth();

  // Test API connection on component mount
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        const response: ApiResponse = await api.get('/health');
        setApiStatus('success');
        setApiMessage(`API Connected: ${response.message}`);
      } catch (error: any) {
        setApiStatus('error');
        setApiMessage(`API Error: ${error.error?.message || 'Connection failed'}`);
      }
    };

    testApiConnection();
  }, []);

  const handleTestApi = async () => {
    setApiStatus('loading');
    setApiMessage('Testing API connection...');
    
    try {
      const response: ApiResponse = await api.get('/health');
      setApiStatus('success');
      setApiMessage(`API Connected: ${response.message}`);
    } catch (error: any) {
      setApiStatus('error');
      setApiMessage(`API Error: ${error.error?.message || 'Connection failed'}`);
    }
  };

  const handleTestLogin = async () => {
    setApiStatus('loading');
    setApiMessage('Testing login...');
    
    try {
      await login({
        email: 'admin@example.com',
        password: 'Admin@123'
      });
      setApiStatus('success');
      setApiMessage(`Login successful! Welcome ${user?.first_name} ${user?.last_name} (${user?.role})`);
    } catch (error: any) {
      setApiStatus('error');
      setApiMessage(`Login failed: ${error.message}`);
    }
  };

  const handleTestLogout = async () => {
    setApiStatus('loading');
    setApiMessage('Testing logout...');
    
    try {
      await logout();
      setApiStatus('success');
      setApiMessage('Logout successful!');
    } catch (error: any) {
      setApiStatus('error');
      setApiMessage(`Logout failed: ${error.message}`);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline for consistent baseline styles */}
      <CssBaseline />
      
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h1"
            color="primary"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Welcome
          </Typography>
          
          <Typography
            variant="h4"
            color="text.secondary"
            gutterBottom
          >
            Electrical Construction Project Management System
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2, mb: 3 }}
          >
            Your project is ready to start building!
          </Typography>

          {/* API Status */}
          <Box sx={{ mb: 3, maxWidth: 600 }}>
            {apiStatus === 'loading' && (
              <Alert severity="info">Testing API connection...</Alert>
            )}
            {apiStatus === 'success' && (
              <Alert severity="success">{apiMessage}</Alert>
            )}
            {apiStatus === 'error' && (
              <Alert severity="error">{apiMessage}</Alert>
            )}
          </Box>

          {/* Authentication Status */}
          <Box sx={{ mb: 3, maxWidth: 600 }}>
            {isLoading && (
              <Alert severity="info">Authentication in progress...</Alert>
            )}
            {isAuthenticated && user && (
              <Alert severity="success">
                Authenticated as: {user.first_name} {user.last_name} ({user.role})
              </Alert>
            )}
            {!isAuthenticated && !isLoading && (
              <Alert severity="warning">Not authenticated</Alert>
            )}
            {error && (
              <Alert severity="error" onClose={clearError}>
                Auth Error: {error}
              </Alert>
            )}
          </Box>

          {/* Test Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleTestApi}
              disabled={apiStatus === 'loading'}
            >
              Test API Connection
            </Button>
            <Button
              variant="outlined"
              onClick={handleTestLogin}
              disabled={apiStatus === 'loading' || isLoading}
            >
              Test Login
            </Button>
            <Button
              variant="outlined"
              onClick={handleTestLogout}
              disabled={apiStatus === 'loading' || isLoading || !isAuthenticated}
              color="secondary"
            >
              Test Logout
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
