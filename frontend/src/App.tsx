import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography, Button, Alert } from '@mui/material';
import { api, ApiResponse } from './services';
import { useAuthStore, useThemeStore } from './store';
import { Login, Dashboard, UserManagement, Settings, FileManagement, ClientManagement, ClientDetail, DailyLogManagement, QuoteManagement } from './pages';
import { ProjectList, ProjectForm, ProjectDetail } from './pages/Projects';
import { DocumentBrowser } from './pages/Documents';
import { AppLayout } from './components/layout';
import { createAppTheme } from './theme/theme';

// Theme Provider Component
const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTheme, mode } = useThemeStore();
  const theme = createAppTheme(currentTheme, mode);

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Main App Component
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

  return (
    <AppThemeProvider>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Projects Routes */}
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectList />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/new" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectForm />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectDetail />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:id/edit" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectForm />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* File Management Routes */}
          <Route 
            path="/files" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FileManagement />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:projectId/files" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FileManagement />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Client Management Routes */}
          <Route 
            path="/clients" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ClientManagement />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clients/:id" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ClientDetail />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/clients/:id/edit"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ClientManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-logs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DailyLogManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Quote Management Routes */}
          <Route 
            path="/quotes" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <QuoteManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* File Management Routes */}
          <Route 
            path="/files" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <FileManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Document Browser Routes */}
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DocumentBrowser />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppThemeProvider>
  );
}

export default App;
