/**
 * User Management Page
 * Super Admin only - Manage users, roles, and permissions
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Fab,
  Grid,
  TablePagination,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  LockReset as LockResetIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuthStore } from '../store';
import { adminService, AdminUser, CreateUserRequest, UpdateUserRequest } from '../services';
import { useMobileView } from '../hooks';
import { MobileListView, MobileListItem } from '../components/common';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const isMobile = useMobileView();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'FIELD_WORKER',
    is_active: true
  });
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Password reset dialog
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAllUsers(page + 1, rowsPerPage);
      setUsers(response.data.users);
      setTotalUsers(response.data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  // Check if current user is super admin - moved after hooks
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Super admin privileges required.
        </Alert>
      </Container>
    );
  }

  const handleOpenDialog = (mode: 'create' | 'edit' | 'view', user?: AdminUser) => {
    setDialogMode(mode);
    setEditingUser(user || null);
    
    if (mode === 'create') {
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'FIELD_WORKER',
        is_active: true
      });
    } else if (user) {
      setFormData({
        email: user.email,
        password: '', // Don't pre-fill password
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'FIELD_WORKER',
      is_active: true
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (dialogMode === 'create') {
        const createData: CreateUserRequest = {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role
        };
        console.log('Creating user with data:', createData);
        await adminService.createUser(createData);
        setSuccess('User created successfully');
      } else if (dialogMode === 'edit' && editingUser) {
        const updateData: UpdateUserRequest = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
          isActive: formData.is_active
        };
        console.log('Updating user with data:', updateData);
        await adminService.updateUser(editingUser.id, updateData);
        setSuccess('User updated successfully');
      }

      handleCloseDialog();
      fetchUsers();
    } catch (err: any) {
      console.error('Operation failed:', err);
      setError(err.message || err.error?.message || 'Operation failed');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError(null);
        await adminService.deleteUser(userId);
        setSuccess('User deleted successfully');
        fetchUsers();
      } catch (err: any) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleResetPassword = async () => {
    try {
      setError(null);
      await adminService.resetUserPassword(selectedUserId, { newPassword });
      setSuccess('Password reset successfully');
      setPasswordDialog(false);
      setNewPassword('');
      setSelectedUserId('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'error';
      case 'PROJECT_MANAGER': return 'primary';
      case 'FIELD_SUPERVISOR': return 'secondary';
      case 'FIELD_WORKER': return 'default';
      case 'OFFICE_ADMIN': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Convert users to mobile list items
  const mobileListItems: MobileListItem[] = users.map((user) => ({
    id: user.id,
    title: `${user.first_name} ${user.last_name}`,
    subtitle: user.email,
    description: user.phone || 'No phone',
    status: {
      label: user.role.replace(/_/g, ' '),
      color: getRoleColor(user.role) as any,
    },
    metadata: [
      { label: 'Active', value: user.is_active ? 'Yes' : 'No' },
      { label: 'Created', value: formatDate(user.created_at) },
    ],
    actions: [
      {
        label: 'View',
        icon: <ViewIcon />,
        onClick: () => handleOpenDialog('view', user),
      },
      {
        label: 'Edit',
        icon: <EditIcon />,
        onClick: () => handleOpenDialog('edit', user),
      },
      {
        label: 'Reset Password',
        icon: <LockResetIcon />,
        onClick: () => {
          setSelectedUserId(user.id);
          setPasswordDialog(true);
        },
      },
      {
        label: 'Delete',
        icon: <DeleteIcon />,
        onClick: () => handleDelete(user.id),
        color: 'error' as const,
      },
    ],
    onClick: () => handleOpenDialog('view', user),
  }));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ minWidth: 140 }}
        >
          Add User
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Users ({totalUsers})
            </Typography>
            <IconButton onClick={fetchUsers} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : isMobile ? (
            <>
              {users.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No users found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create your first user to get started
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('create')}
                    sx={{ minHeight: 44 }}
                  >
                    Add User
                  </Button>
                </Box>
              ) : (
                <MobileListView items={mobileListItems} />
              )}
              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role.replace(/_/g, ' ')}
                            color={getRoleColor(user.role) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            color={user.is_active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('view', user)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('edit', user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setPasswordDialog(true);
                              }}
                            >
                              <LockResetIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(user.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={totalUsers}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit/View Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Create User' : 
           dialogMode === 'edit' ? 'Edit User' : 'View User'}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              },
              gap: 2,
              mt: 1,
            }}
          >
            <Box>
              <TextField
                fullWidth
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>
            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>
            {dialogMode === 'create' && (
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Box>
            )}
            <Box>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={dialogMode === 'view'}
                required
              />
            </Box>
            <Box>
              <FormControl fullWidth disabled={dialogMode === 'view'}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="FIELD_WORKER">Field Worker</MenuItem>
                  <MenuItem value="FIELD_SUPERVISOR">Field Supervisor</MenuItem>
                  <MenuItem value="PROJECT_MANAGER">Project Manager</MenuItem>
                  <MenuItem value="OFFICE_ADMIN">Office Admin</MenuItem>
                  <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {dialogMode !== 'create' && (
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={dialogMode === 'view'}
                    />
                  }
                  label="Active"
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained">
              {dialogMode === 'create' ? 'Create' : 'Update'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained" disabled={!newPassword}>
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;
