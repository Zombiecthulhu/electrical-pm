/**
 * Empty State Components
 * 
 * Reusable components for displaying empty states with helpful messages and actions.
 * Improves UX by guiding users when no data is available.
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  SvgIconProps,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudOff as CloudOffIcon,
  ErrorOutline as ErrorIcon,
  FolderOpen as FolderIcon,
  Description as DocumentIcon,
  People as PeopleIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

interface EmptyStateProps {
  icon?: React.ComponentType<SvgIconProps>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'search' | 'filter' | 'error';
}

/**
 * Generic Empty State Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = InboxIcon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
}) => {
  const getIconColor = () => {
    switch (variant) {
      case 'error':
        return 'error.main';
      case 'search':
      case 'filter':
        return 'info.main';
      default:
        return 'action.disabled';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        minHeight: 400,
      }}
    >
      <Icon
        sx={{
          fontSize: 80,
          color: getIconColor(),
          mb: 3,
          opacity: 0.5,
        }}
      />
      <Typography variant="h5" gutterBottom fontWeight={600}>
        {title}
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 500, mb: 4 }}
      >
        {description}
      </Typography>
      {(actionLabel || secondaryActionLabel) && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actionLabel && onAction && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAction}
              size="large"
            >
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              variant="outlined"
              onClick={onSecondaryAction}
              size="large"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

/**
 * Empty Search Results
 */
export const EmptySearchState: React.FC<{
  searchTerm: string;
  onClearSearch?: () => void;
}> = ({ searchTerm, onClearSearch }) => (
  <EmptyState
    icon={SearchIcon}
    title="No Results Found"
    description={`We couldn't find any results for "${searchTerm}". Try adjusting your search terms or clearing filters.`}
    actionLabel={onClearSearch ? "Clear Search" : undefined}
    onAction={onClearSearch}
    variant="search"
  />
);

/**
 * Empty Filter Results
 */
export const EmptyFilterState: React.FC<{
  onClearFilters?: () => void;
}> = ({ onClearFilters }) => (
  <EmptyState
    icon={FilterIcon}
    title="No Matches Found"
    description="No items match your current filters. Try adjusting or clearing the filters to see more results."
    actionLabel={onClearFilters ? "Clear Filters" : undefined}
    onAction={onClearFilters}
    variant="filter"
  />
);

/**
 * Error State
 */
export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({
  title = "Something Went Wrong",
  description = "We encountered an error while loading this data. Please try again.",
  onRetry,
}) => (
  <EmptyState
    icon={ErrorIcon}
    title={title}
    description={description}
    actionLabel={onRetry ? "Try Again" : undefined}
    onAction={onRetry}
    variant="error"
  />
);

/**
 * Offline State
 */
export const OfflineState: React.FC = () => (
  <EmptyState
    icon={CloudOffIcon}
    title="You're Offline"
    description="Please check your internet connection and try again."
    variant="error"
  />
);

/**
 * Empty Projects List
 */
export const EmptyProjectsState: React.FC<{
  onCreateProject?: () => void;
}> = ({ onCreateProject }) => (
  <EmptyState
    icon={WorkIcon}
    title="No Projects Yet"
    description="Get started by creating your first project. Projects help you organize work, track progress, and manage your team."
    actionLabel={onCreateProject ? "Create Project" : undefined}
    onAction={onCreateProject}
  />
);

/**
 * Empty Clients List
 */
export const EmptyClientsState: React.FC<{
  onCreateClient?: () => void;
}> = ({ onCreateClient }) => (
  <EmptyState
    icon={PeopleIcon}
    title="No Clients Yet"
    description="Start building your client base. Add clients to track projects, contacts, and communication history."
    actionLabel={onCreateClient ? "Add Client" : undefined}
    onAction={onCreateClient}
  />
);

/**
 * Empty Daily Logs List
 */
export const EmptyDailyLogsState: React.FC<{
  onCreateLog?: () => void;
}> = ({ onCreateLog }) => (
  <EmptyState
    icon={AssignmentIcon}
    title="No Daily Logs"
    description="Keep track of daily activities, crew hours, and project progress. Start by creating your first daily log."
    actionLabel={onCreateLog ? "Create Daily Log" : undefined}
    onAction={onCreateLog}
  />
);

/**
 * Empty Quotes List
 */
export const EmptyQuotesState: React.FC<{
  onCreateQuote?: () => void;
}> = ({ onCreateQuote }) => (
  <EmptyState
    icon={AssignmentIcon}
    title="No Quotes Yet"
    description="Create professional quotes for your clients. Track quote status from draft to accepted."
    actionLabel={onCreateQuote ? "Create Quote" : undefined}
    onAction={onCreateQuote}
  />
);

/**
 * Empty Files/Documents List
 */
export const EmptyFilesState: React.FC<{
  onUploadFile?: () => void;
}> = ({ onUploadFile }) => (
  <EmptyState
    icon={FolderIcon}
    title="No Files Yet"
    description="Upload photos, documents, plans, and other files to keep everything organized in one place."
    actionLabel={onUploadFile ? "Upload Files" : undefined}
    onAction={onUploadFile}
  />
);

/**
 * Empty Documents List
 */
export const EmptyDocumentsState: React.FC<{
  onUploadDocument?: () => void;
}> = ({ onUploadDocument }) => (
  <EmptyState
    icon={DocumentIcon}
    title="No Documents"
    description="Store contracts, permits, plans, and other important documents securely."
    actionLabel={onUploadDocument ? "Upload Document" : undefined}
    onAction={onUploadDocument}
  />
);

/**
 * Empty State in Card (compact version)
 */
export const EmptyStateCard: React.FC<{
  icon?: React.ComponentType<SvgIconProps>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon: Icon = InboxIcon, title, description, actionLabel, onAction }) => (
  <Card variant="outlined" sx={{ minHeight: 200 }}>
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 3,
          textAlign: 'center',
        }}
      >
        <Icon
          sx={{
            fontSize: 48,
            color: 'action.disabled',
            mb: 2,
            opacity: 0.5,
          }}
        />
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        {actionLabel && onAction && (
          <Button variant="outlined" size="small" onClick={onAction} startIcon={<AddIcon />}>
            {actionLabel}
          </Button>
        )}
      </Box>
    </CardContent>
  </Card>
);

export default EmptyState;

