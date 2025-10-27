/**
 * Employee Directory Page
 * 
 * Main page for employee directory management
 * Orchestrates list, detail, and form views
 */

import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useEmployeeStore } from '../../store';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '../../services/employee.service';
import { ResponsiveDialog } from '../../components/common';
import EmployeeList from './EmployeeList';
import EmployeeForm from './EmployeeForm';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const EmployeeDirectory: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { createEmployee, updateEmployee, isLoading } = useEmployeeStore();

  // Handle add new employee
  const handleAdd = () => {
    setSelectedEmployee(null);
    setViewMode('create');
  };

  // Handle edit employee
  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMode('edit');
  };

  // Handle view employee details
  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewMode('view');
  };

  // Handle save (create or update)
  const handleSave = async (data: CreateEmployeeData | UpdateEmployeeData) => {
    try {
      if (viewMode === 'create') {
        await createEmployee(data as CreateEmployeeData);
      } else if (viewMode === 'edit' && selectedEmployee) {
        await updateEmployee(selectedEmployee.id, data as UpdateEmployeeData);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      throw error;
    }
  };

  // Handle close dialog
  const handleClose = () => {
    setViewMode('list');
    setSelectedEmployee(null);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Employee List */}
      <EmployeeList
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
      />

      {/* Create/Edit Dialog */}
      <ResponsiveDialog
        open={viewMode === 'create' || viewMode === 'edit'}
        onClose={handleClose}
        title={viewMode === 'create' ? 'Add Employee' : 'Edit Employee'}
        maxWidth="md"
        fullWidth
      >
        <EmployeeForm
          employee={selectedEmployee}
          onSave={handleSave}
          onCancel={handleClose}
          isLoading={isLoading}
        />
      </ResponsiveDialog>

      {/* View Dialog (for future detail view) */}
      {viewMode === 'view' && selectedEmployee && (
        <ResponsiveDialog
          open={true}
          onClose={handleClose}
          title={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ p: 2 }}>
            {/* TODO: Add detailed employee view component */}
            <p>Employee Details - Coming Soon</p>
          </Box>
        </ResponsiveDialog>
      )}
    </Box>
  );
};

export default EmployeeDirectory;

