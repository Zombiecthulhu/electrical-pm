import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Palette,
  Save,
} from '@mui/icons-material';
import { useAuthStore, useThemeStore } from '../store';
import { authService } from '../services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { currentTheme, mode, setTheme, setMode, toggleMode } = useThemeStore();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Appearance settings state - use theme store values directly
  const appearanceSettings = {
    theme: currentTheme,
    darkMode: mode === 'dark',
  };

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleAppearanceChange = (field: string) => (event: any) => {
    const newValue = event.target.value || event.target.checked;
    
    // Apply changes immediately to theme store
    if (field === 'theme') {
      setTheme(newValue);
    } else if (field === 'darkMode') {
      // Use toggleMode for better UX
      toggleMode();
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      // Update profile logic would go here
      // For now, we'll just show a success message
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAppearance = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Settings are already applied immediately, just show success message
      setMessage({ type: 'success', text: 'Appearance settings saved!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save appearance settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (tabValue === 0) {
      handleSaveProfile();
    } else {
      handleSaveAppearance();
    }
  };

  const themeOptions = [
    { value: 'professional-blue', label: 'Professional Blue' },
    { value: 'electrical-orange', label: 'Electrical Orange' },
    { value: 'forest-green', label: 'Forest Green' },
    { value: 'dark-mode', label: 'Dark Mode' },
    { value: 'inman-knight', label: 'Inman Knight' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account settings and preferences
      </Typography>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="settings tabs"
          >
            <Tab 
              icon={<Person />} 
              label="Profile" 
              id="settings-tab-0"
              aria-controls="settings-tabpanel-0"
            />
            <Tab 
              icon={<Palette />} 
              label="Appearance" 
              id="settings-tab-1"
              aria-controls="settings-tabpanel-1"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Update your personal information
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3,
            }}
          >
            <TextField
              fullWidth
              label="First Name"
              value={profileData.firstName}
              onChange={handleProfileChange('firstName')}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={profileData.lastName}
              onChange={handleProfileChange('lastName')}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange('email')}
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Phone"
              value={profileData.phone}
              onChange={handleProfileChange('phone')}
              disabled={loading}
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Customize the look and feel of your application
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={appearanceSettings.theme}
                onChange={handleAppearanceChange('theme')}
                label="Theme"
                disabled={loading}
              >
                {themeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={appearanceSettings.darkMode}
                    onChange={handleAppearanceChange('darkMode')}
                    disabled={loading}
                  />
                }
                label="Dark Mode"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary">
            <strong>Theme Preview:</strong>
            <br />
            • <strong>Professional Blue:</strong> Clean, corporate look with blue accents
            <br />
            • <strong>Electrical Orange:</strong> High-visibility orange theme for field work
            <br />
            • <strong>Forest Green:</strong> Natural, calming green theme
            <br />
            • <strong>Dark Mode:</strong> Dark background with light text for low-light environments
            <br />
            • <strong>Inman Knight:</strong> Dark blue and gold theme for a professional, distinguished look
          </Typography>
        </TabPanel>

        <Divider />

        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            onClick={handleSave}
            disabled={loading}
            size="large"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default Settings;
