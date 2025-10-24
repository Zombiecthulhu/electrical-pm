import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Button, Alert } from '@mui/material';
import theme from './theme';
import { api, ApiResponse, authService } from './services';

function App() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [apiMessage, setApiMessage] = useState<string>('');

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
      const response = await authService.login({
        email: 'admin@example.com',
        password: 'Admin@123'
      });
      setApiStatus('success');
      setApiMessage(`Login successful! Welcome ${response.user.first_name} ${response.user.last_name} (${response.user.role})`);
    } catch (error: any) {
      setApiStatus('error');
      setApiMessage(`Login failed: ${error.message}`);
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

          {/* Test Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
              disabled={apiStatus === 'loading'}
            >
              Test Login
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
