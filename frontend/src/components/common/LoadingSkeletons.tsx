/**
 * Loading Skeleton Components
 * 
 * Reusable skeleton components for displaying loading states.
 * Provides better UX than simple spinners for data-heavy interfaces.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

/**
 * Table Skeleton - For DataGrid and Table loading states
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}> = ({ rows = 10, columns = 5, showHeader = true }) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        {showHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, index) => (
                <TableCell key={`header-${index}`}>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={`cell-${rowIndex}-${colIndex}`}>
                  <Skeleton variant="text" width="90%" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Card Skeleton - For card-based layouts
 */
export const CardSkeleton: React.FC<{
  count?: number;
  height?: number;
  variant?: 'default' | 'media';
}> = ({ count = 1, height = 200, variant = 'default' }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`card-skeleton-${index}`} sx={{ mb: 2 }}>
          <CardContent>
            {variant === 'media' && (
              <Skeleton variant="rectangular" width="100%" height={height} sx={{ mb: 2 }} />
            )}
            <Skeleton variant="text" width="60%" height={30} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
          </CardContent>
        </Card>
      ))}
    </>
  );
};

/**
 * List Skeleton - For list views
 */
export const ListSkeleton: React.FC<{
  items?: number;
  showAvatar?: boolean;
}> = ({ items = 5, showAvatar = true }) => {
  return (
    <Box>
      {Array.from({ length: items }).map((_, index) => (
        <Box
          key={`list-item-${index}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width={80} height={36} />
        </Box>
      ))}
    </Box>
  );
};

/**
 * Form Skeleton - For form loading states
 */
export const FormSkeleton: React.FC<{
  fields?: number;
}> = ({ fields = 6 }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {Array.from({ length: fields }).map((_, index) => (
        <Box key={`form-field-${index}`}>
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={56} />
        </Box>
      ))}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
        <Skeleton variant="rectangular" width={100} height={42} />
        <Skeleton variant="rectangular" width={100} height={42} />
      </Box>
    </Box>
  );
};

/**
 * Detail View Skeleton - For detail pages
 */
export const DetailSkeleton: React.FC = () => {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="25%" height={24} />
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
          </CardContent>
        </Card>
      </Box>

      {/* Table Section */}
      <Card>
        <CardContent>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
          <TableSkeleton rows={5} columns={4} showHeader={true} />
        </CardContent>
      </Card>
    </Box>
  );
};

/**
 * Dashboard Card Skeleton - For dashboard stats cards
 */
export const DashboardCardSkeleton: React.FC<{
  count?: number;
}> = ({ count = 4 }) => {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`dashboard-card-${index}`}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="circular" width={40} height={40} />
            </Box>
            <Skeleton variant="text" width="40%" height={48} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={20} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

/**
 * Image Grid Skeleton - For photo galleries
 */
export const ImageGridSkeleton: React.FC<{
  count?: number;
  columns?: { xs: number; sm: number; md: number };
}> = ({ count = 12, columns = { xs: 1, sm: 2, md: 3 } }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: `repeat(${columns.xs}, 1fr)`,
          sm: `repeat(${columns.sm}, 1fr)`,
          md: `repeat(${columns.md}, 1fr)`,
        },
        gap: 2,
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <Box key={`image-skeleton-${index}`}>
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </Box>
      ))}
    </Box>
  );
};

