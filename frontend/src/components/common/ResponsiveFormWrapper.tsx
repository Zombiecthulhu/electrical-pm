/**
 * Responsive Form Wrapper
 * 
 * Provides mobile-optimized layout for forms with automatic:
 * - Single column layout on mobile
 * - Full-width inputs
 * - Touch-friendly sizing (44px minimum)
 * - Vertical button stacks on mobile
 * - Proper spacing and padding
 */

import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { useMobileView } from '../../hooks';

interface ResponsiveFormWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  elevation?: number;
  sx?: SxProps<Theme>;
}

/**
 * Form Wrapper with mobile optimizations
 */
export const ResponsiveFormWrapper: React.FC<ResponsiveFormWrapperProps> = ({
  children,
  title,
  subtitle,
  maxWidth = 'md',
  elevation = 1,
  sx = {},
}) => {
  const isMobile = useMobileView();

  return (
    <Box
      sx={{
        maxWidth: maxWidth ? (theme) => theme.breakpoints.values[maxWidth] : '100%',
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
        ...sx,
      }}
    >
      <Paper
        elevation={elevation}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 2, sm: 3 },
        }}
      >
        {(title || subtitle) && (
          <>
            <Box mb={3}>
              {title && (
                <Typography 
                  variant={isMobile ? 'h6' : 'h5'} 
                  component="h1" 
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />
          </>
        )}
        {children}
      </Paper>
    </Box>
  );
};

/**
 * Form Row - responsive field container
 */
interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  sx?: SxProps<Theme>;
}

export const FormRow: React.FC<FormRowProps> = ({ 
  children, 
  columns = 1,
  sx = {} 
}) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr', // Always single column on mobile
          sm: columns === 1 ? '1fr' : `repeat(${columns}, 1fr)`,
        },
        gap: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Form Actions - responsive button container
 */
interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sx?: SxProps<Theme>;
}

export const FormActions: React.FC<FormActionsProps> = ({ 
  children, 
  align = 'right',
  sx = {} 
}) => {
  const isMobile = useMobileView();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        gap: { xs: 1.5, sm: 2 },
        justifyContent: 
          isMobile ? 'stretch' : 
          align === 'center' ? 'center' : 
          align === 'left' ? 'flex-start' : 
          'flex-end',
        mt: { xs: 3, sm: 4 },
        pt: { xs: 2, sm: 3 },
        borderTop: 1,
        borderColor: 'divider',
        '& > button': {
          minHeight: 44, // Touch-friendly
          width: { xs: '100%', sm: 'auto' },
          minWidth: { sm: 100 },
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Form Section - grouping related fields
 */
interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  sx?: SxProps<Theme>;
}

export const FormSection: React.FC<FormSectionProps> = ({
  children,
  title,
  subtitle,
  sx = {},
}) => {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 }, ...sx }}>
      {(title || subtitle) && (
        <Box mb={2}>
          {title && (
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
};

/**
 * Mobile-optimized form field props
 */
export const mobileFormFieldProps = {
  fullWidth: true,
  sx: {
    '& .MuiInputBase-root': {
      minHeight: 44, // Touch-friendly
    },
    '& .MuiInputBase-input': {
      fontSize: { xs: '16px', sm: '14px' }, // Prevents iOS zoom
    },
  },
};

/**
 * Mobile-optimized button props
 */
export const mobileButtonProps = {
  fullWidth: { xs: true, sm: false } as any,
  sx: {
    minHeight: 44,
    fontSize: { xs: '1rem', sm: '0.875rem' },
  },
};

export default ResponsiveFormWrapper;

