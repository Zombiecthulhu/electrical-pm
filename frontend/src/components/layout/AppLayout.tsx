import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Business,
  Description,
  PhotoCamera,
  Assignment,
  People,
  Settings,
  Logout,
  AccountCircle,
  Folder,
  Work,
  RequestQuote,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useMobileView, useCompactView, usePermissions } from '../../hooks';
import { Feature } from '../../utils/permissions';
import { MobileBottomNav } from './MobileBottomNav';
import logo from '../../assets/images/iie-logo.png';

const drawerWidth = 240;

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useMobileView(); // < 600px
  const isCompact = useCompactView(); // < 900px
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { canAccess } = usePermissions();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleUserMenuClose();
  };

  // All menu items with their associated feature permissions
  const allMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', feature: 'dashboard' as Feature },
    { text: 'Projects', icon: <Assignment />, path: '/projects', feature: 'projects' as Feature },
    { text: 'Files', icon: <Folder />, path: '/files', feature: 'files' as Feature },
    { text: 'Clients', icon: <Business />, path: '/clients', feature: 'clients' as Feature },
    { text: 'Documents', icon: <Description />, path: '/documents', feature: 'documents' as Feature },
    { text: 'Photos', icon: <PhotoCamera />, path: '/photos', feature: 'photos' as Feature },
    { text: 'Daily Logs', icon: <Work />, path: '/daily-logs', feature: 'daily-logs' as Feature },
    { text: 'Quotes', icon: <RequestQuote />, path: '/quotes', feature: 'quotes' as Feature },
    { text: 'Employees', icon: <People />, path: '/employees', feature: 'employees' as Feature },
    { text: 'Time Keeping', icon: <AccessTime />, path: '/timekeeping', feature: 'timekeeping' as Feature },
    { text: 'Users', icon: <People />, path: '/admin/users', feature: 'users' as Feature },
    { text: 'Settings', icon: <Settings />, path: '/settings', feature: 'settings' as Feature },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => canAccess(item.feature));

  const drawer = (
    <Box>
      <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        <Box
          component="img"
          src={logo}
          alt="Inman Industrial Electric"
          sx={{
            width: '100%',
            maxWidth: 180,
            height: 'auto',
            mb: 1,
          }}
        />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          CRM System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isCompact) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                minHeight: 48, // Touch-friendly height
                px: 2.5,
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              width: 48, // Touch-friendly
              height: 48,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant={isMobile ? 'body1' : 'h6'} 
            noWrap 
            component="div" 
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            IIE CRM
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 1,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                IIE
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
              <Typography variant="caption">
                Production v1.0.0
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                mr: 1,
              }}
            >
              {user?.first_name} {user?.last_name}
            </Typography>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleUserMenuOpen}
              color="inherit"
              sx={{
                width: 48, // Touch-friendly
                height: 48,
              }}
            >
              <Avatar sx={{ width: 36, height: 36 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 }, // Less padding on mobile
          pb: { xs: 9, sm: 3 }, // Extra bottom padding on mobile for bottom nav
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>

      {/* Mobile Bottom Navigation - only visible on compact screens */}
      <MobileBottomNav />
    </Box>
  );
};

export default AppLayout;
