import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress, Typography } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { api, ApiResponse } from './services';
import { useAuthStore, useThemeStore } from './store';
import { AppLayout } from './components/layout';
import { SessionTimeout } from './components/common';
import { createAppTheme } from './theme/theme';

// Lazy load all page components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Settings = lazy(() => import('./pages/Settings'));
const FileManagement = lazy(() => import('./pages/FileManagement'));
const ClientManagement = lazy(() => import('./pages/ClientManagement'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const DailyLogManagement = lazy(() => import('./pages/DailyLogManagement'));
const QuoteManagement = lazy(() => import('./pages/QuoteManagement'));
const ProjectList = lazy(() => import('./pages/Projects/ProjectList'));
const ProjectForm = lazy(() => import('./pages/Projects/ProjectForm'));
const ProjectDetail = lazy(() => import('./pages/Projects/ProjectDetail'));
const DocumentBrowser = lazy(() => import('./pages/Documents/DocumentBrowser'));
const EmployeeDirectory = lazy(() => import('./pages/EmployeeDirectory'));

// Loading Fallback Component
const LoadingFallback: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      gap: 2,
    }}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

// Theme Provider Component
const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTheme, mode } = useThemeStore();
  const theme = createAppTheme(currentTheme, mode);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={5000}
      >
        {children}
      </SnackbarProvider>
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
      {/* Session timeout warning */}
      <SessionTimeout warningMinutes={5} />
      
      <Router>
        <Suspense fallback={<LoadingFallback />}>
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

          {/* Employee Directory Routes */}
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EmployeeDirectory />
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
        </Suspense>
      </Router>
    </AppThemeProvider>
  );
}

export default App;
