import React, { useState, useEffect } from 'react';
import { Box, Chip, Typography, Alert, CircularProgress } from '@mui/material';
import { CheckCircle, Error, Refresh } from '@mui/icons-material';
import api from '../../services/api';

interface ServerStatusProps {
  onStatusChange?: (isConnected: boolean) => void;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkServerStatus = async () => {
    try {
      setStatus('checking');
      // Use the health check endpoint instead of auth endpoint
      await api.get('/health');
      setStatus('connected');
      setLastChecked(new Date());
      onStatusChange?.(true);
    } catch (error) {
      setStatus('disconnected');
      setLastChecked(new Date());
      onStatusChange?.(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
    // Check every 30 seconds
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'disconnected':
        return 'error';
      case 'checking':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle />;
      case 'disconnected':
        return <Error />;
      case 'checking':
        return <CircularProgress size={16} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Server Connected';
      case 'disconnected':
        return 'Server Disconnected';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity={status === 'connected' ? 'success' : status === 'disconnected' ? 'error' : 'info'}
        icon={getStatusIcon()}
        action={
          <Chip
            icon={<Refresh />}
            label="Refresh"
            size="small"
            onClick={checkServerStatus}
            disabled={status === 'checking'}
            sx={{ ml: 1 }}
          />
        }
      >
        <Typography variant="body2">
          {getStatusText()}
          {lastChecked && (
            <Typography variant="caption" display="block">
              Last checked: {lastChecked.toLocaleTimeString()}
            </Typography>
          )}
        </Typography>
      </Alert>
    </Box>
  );
};

export default ServerStatus;
