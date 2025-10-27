/**
 * Mobile Bottom Navigation
 * 
 * Provides quick access to main sections on mobile devices.
 * Shows at bottom of screen on mobile (< 900px), hidden on desktop.
 * 
 * Features:
 * - Icon + Label navigation
 * - Active state highlighting
 * - Touch-friendly sizing (56px height)
 * - Persistent across pages
 * - Only visible on mobile
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Folder as ProjectIcon,
  Description as QuoteIcon,
  AssignmentTurnedIn as DailyLogIcon,
} from '@mui/icons-material';
import { useCompactView } from '../../hooks';

/**
 * Mobile Bottom Navigation Component
 */
export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCompact = useCompactView();

  // Don't show on desktop
  if (!isCompact) {
    return null;
  }

  // Get current active section
  const getCurrentValue = (): string => {
    const path = location.pathname;
    if (path.startsWith('/projects')) return '/projects';
    if (path.startsWith('/clients')) return '/clients';
    if (path.startsWith('/quotes')) return '/quotes';
    if (path.startsWith('/daily-logs')) return '/daily-logs';
    return '/';
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderRadius: 0,
        borderTop: 1,
        borderColor: 'divider',
        // Add safe area padding for iOS devices with notch/home indicator
        pb: 'env(safe-area-inset-bottom)',
      }}
      elevation={8}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          height: 56,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 60,
            padding: '6px 12px 8px',
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Home"
          value="/"
          icon={<DashboardIcon />}
        />
        <BottomNavigationAction
          label="Projects"
          value="/projects"
          icon={<ProjectIcon />}
        />
        <BottomNavigationAction
          label="Clients"
          value="/clients"
          icon={<BusinessIcon />}
        />
        <BottomNavigationAction
          label="Quotes"
          value="/quotes"
          icon={<QuoteIcon />}
        />
        <BottomNavigationAction
          label="Logs"
          value="/daily-logs"
          icon={<DailyLogIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;

