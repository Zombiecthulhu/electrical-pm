/**
 * Session Timeout Component
 * 
 * Monitors token expiration and warns users before automatic logout
 * Provides option to extend session
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { isTokenExpired, getTokenTimeRemaining, formatTimeRemaining } from '../../utils/token';
import { useAuthStore } from '../../store';
import { refreshToken as refreshAuthToken } from '../../services/auth.service';

interface SessionTimeoutProps {
  // Warn when session has this many minutes left (default: 5)
  warningMinutes?: number;
  // Check interval in seconds (default: 30)
  checkInterval?: number;
}

export const SessionTimeout: React.FC<SessionTimeoutProps> = ({
  warningMinutes = 5,
  checkInterval = 30,
}) => {
  const { user, logout } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Only run if user is logged in
    if (!user) {
      setShowWarning(false);
      setHasShownWarning(false);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    // Check token expiration periodically
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        clearInterval(intervalId);
        return;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        clearInterval(intervalId);
        setShowWarning(false);
        // Logout user
        logout();
        return;
      }

      // Get time remaining
      const remaining = getTokenTimeRemaining(token);
      setTimeRemaining(remaining);

      // Show warning if token expires soon and we haven't shown it yet
      const warningThreshold = warningMinutes * 60;
      if (remaining <= warningThreshold && remaining > 0 && !hasShownWarning) {
        setShowWarning(true);
        setHasShownWarning(true);
      }
    }, checkInterval * 1000);

    return () => clearInterval(intervalId);
  }, [user, warningMinutes, checkInterval, hasShownWarning, logout]);

  const handleExtendSession = async () => {
    setIsRefreshing(true);
    try {
      // Call the refresh token endpoint
      const { accessToken } = await refreshAuthToken();
      
      // Update token in localStorage
      localStorage.setItem('accessToken', accessToken);
      
      // Close dialog and reset warning state
      setShowWarning(false);
      setHasShownWarning(false);
      
      console.log('Session extended successfully');
    } catch (error) {
      console.error('Failed to extend session:', error);
      // If refresh fails, log the user out
      logout();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    setShowWarning(false);
    logout();
  };

  const progressPercentage = (timeRemaining / (warningMinutes * 60)) * 100;

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}} // Prevent closing by clicking outside
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <Typography variant="h6">Session Expiring Soon</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Your session will expire in:
        </Typography>
        
        <Box sx={{ my: 3, textAlign: 'center' }}>
          <Typography variant="h3" color="warning.main" fontWeight="bold">
            {formatTimeRemaining(timeRemaining)}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 2,
            '& .MuiLinearProgress-bar': {
              backgroundColor: progressPercentage > 50 ? 'success.main' : 'warning.main',
            },
          }}
        />

        <Typography variant="body2" color="text.secondary">
          For security reasons, you'll be automatically logged out when your session expires.
          Click "Stay Logged In" to extend your session.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          color="inherit"
        >
          Logout Now
        </Button>
        <Button
          onClick={handleExtendSession}
          variant="contained"
          startIcon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          disabled={isRefreshing}
          autoFocus
        >
          {isRefreshing ? 'Refreshing...' : 'Stay Logged In'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeout;

