/**
 * Mobile List View Component
 * 
 * Card-based list view optimized for mobile devices.
 * Replaces DataGrid tables on small screens for better usability.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Stack,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

export interface MobileListItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: {
    label: string;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  };
  metadata?: Array<{ label: string; value: string | React.ReactNode }>;
  avatar?: React.ReactNode;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  }>;
  onClick?: () => void;
}

interface MobileListViewProps {
  items: MobileListItem[];
  loading?: boolean;
  onItemClick?: (id: string) => void;
}

/**
 * Mobile List View Component
 * 
 * Displays data in card format optimized for mobile screens.
 */
export const MobileListView: React.FC<MobileListViewProps> = ({
  items,
  loading = false,
  onItemClick,
}) => {
  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} sx={{ minHeight: 120 }}>
            <CardContent>
              <Box sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                <Typography variant="h6">Loading...</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  if (items.length === 0) {
    return null; // Let parent handle empty state
  }

  return (
    <Stack spacing={2}>
      {items.map((item) => (
        <Card
          key={item.id}
          sx={{
            transition: 'all 0.2s',
            '&:active': {
              transform: 'scale(0.98)',
              boxShadow: 1,
            },
          }}
        >
          <CardContent
            onClick={item.onClick || (onItemClick ? () => onItemClick(item.id) : undefined)}
            sx={{
              cursor: item.onClick || onItemClick ? 'pointer' : 'default',
              '&:active': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            {/* Header Row */}
            <Box display="flex" alignItems="flex-start" mb={1}>
              {item.avatar && (
                <Box mr={2}>
                  {typeof item.avatar === 'string' ? (
                    <Avatar src={item.avatar} />
                  ) : (
                    item.avatar
                  )}
                </Box>
              )}
              <Box flex={1} minWidth={0}>
                <Typography variant="h6" noWrap>
                  {item.title}
                </Typography>
                {item.subtitle && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {item.subtitle}
                  </Typography>
                )}
              </Box>
              {item.status && (
                <Chip
                  label={item.status.label}
                  color={item.status.color || 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>

            {/* Description */}
            {item.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {item.description}
              </Typography>
            )}

            {/* Metadata */}
            {item.metadata && item.metadata.length > 0 && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={0.5}>
                  {item.metadata.map((meta, index) => (
                    <Box
                      key={index}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        {meta.label}:
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {meta.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </CardContent>

          {/* Actions */}
          {item.actions && item.actions.length > 0 && (
            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack direction="row" spacing={1} width="100%">
                {item.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="small"
                    color={action.color || 'primary'}
                    startIcon={action.icon}
                    onClick={action.onClick}
                    sx={{ minWidth: 44, minHeight: 44 }} // Touch-friendly
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            </CardActions>
          )}
        </Card>
      ))}
    </Stack>
  );
};

/**
 * Simplified Mobile List (Just title and chevron)
 */
export const SimpleMobileList: React.FC<{
  items: Array<{ id: string; title: string; subtitle?: string }>;
  onItemClick: (id: string) => void;
}> = ({ items, onItemClick }) => {
  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Card
          key={item.id}
          onClick={() => onItemClick(item.id)}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:active': {
              transform: 'scale(0.98)',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box flex={1} minWidth={0}>
                <Typography variant="body1" fontWeight={500} noWrap>
                  {item.title}
                </Typography>
                {item.subtitle && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {item.subtitle}
                  </Typography>
                )}
              </Box>
              <ChevronRightIcon color="action" />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default MobileListView;

