/**
 * Mobile UI Utilities
 * 
 * Utilities and helpers for mobile-optimized UI.
 */

import { SxProps, Theme } from '@mui/material/styles';

/**
 * Minimum touch target size (Apple/Google guidelines)
 */
export const TOUCH_TARGET_SIZE = 44;

/**
 * Touch-friendly button styles
 */
export const touchFriendlyButton: SxProps<Theme> = {
  minWidth: TOUCH_TARGET_SIZE,
  minHeight: TOUCH_TARGET_SIZE,
  padding: { xs: 1.5, sm: 1 },
};

/**
 * Touch-friendly icon button styles
 */
export const touchFriendlyIconButton: SxProps<Theme> = {
  width: TOUCH_TARGET_SIZE,
  height: TOUCH_TARGET_SIZE,
};

/**
 * Touch-friendly input styles
 */
export const touchFriendlyInput: SxProps<Theme> = {
  '& .MuiInputBase-root': {
    minHeight: TOUCH_TARGET_SIZE,
  },
  '& .MuiInputBase-input': {
    fontSize: { xs: '16px', sm: '14px' }, // Prevents zoom on iOS
  },
};

/**
 * Touch-friendly checkbox/radio styles
 */
export const touchFriendlyCheckbox: SxProps<Theme> = {
  '& .MuiCheckbox-root, & .MuiRadio-root': {
    padding: 1.5,
  },
  '& .MuiSvgIcon-root': {
    fontSize: 28,
  },
};

/**
 * Mobile-optimized card styles
 */
export const mobileCard: SxProps<Theme> = {
  width: '100%',
  '&:active': {
    transform: 'scale(0.98)',
    boxShadow: 1,
  },
  transition: 'all 0.2s',
};

/**
 * Mobile-optimized dialog content padding
 */
export const mobileDialogContent: SxProps<Theme> = {
  px: { xs: 2, sm: 3 },
  py: { xs: 2, sm: 3 },
};

/**
 * Mobile-optimized dialog actions
 */
export const mobileDialogActions: SxProps<Theme> = {
  px: { xs: 2, sm: 3 },
  py: 2,
  gap: { xs: 1, sm: 2 },
  flexDirection: { xs: 'column', sm: 'row' },
  '& > button': {
    width: { xs: '100%', sm: 'auto' },
    minHeight: TOUCH_TARGET_SIZE,
  },
};

/**
 * Responsive grid columns
 */
export const responsiveColumns = {
  xs: 12, // Mobile: 1 column
  sm: 6,  // Tablet portrait: 2 columns
  md: 4,  // Tablet landscape: 3 columns
  lg: 3,  // Desktop: 4 columns
};

/**
 * Responsive spacing
 */
export const responsiveSpacing = {
  xs: 1,  // Mobile: 8px
  sm: 2,  // Tablet: 16px
  md: 3,  // Desktop: 24px
};

/**
 * Responsive padding
 */
export const responsivePadding: SxProps<Theme> = {
  p: { xs: 2, sm: 3, md: 4 },
};

/**
 * Full-width on mobile
 */
export const fullWidthOnMobile: SxProps<Theme> = {
  width: { xs: '100%', sm: 'auto' },
};

/**
 * Stack vertically on mobile
 */
export const stackOnMobile: SxProps<Theme> = {
  flexDirection: { xs: 'column', sm: 'row' },
  gap: { xs: 1, sm: 2 },
};

/**
 * Hide on mobile
 */
export const hideOnMobile: SxProps<Theme> = {
  display: { xs: 'none', sm: 'block' },
};

/**
 * Show only on mobile
 */
export const showOnlyMobile: SxProps<Theme> = {
  display: { xs: 'block', sm: 'none' },
};

/**
 * Prevent text zoom on iOS input focus
 */
export const preventIOSZoom = {
  fontSize: '16px', // iOS won't zoom if font-size >= 16px
};

/**
 * Touch-optimized table styles
 */
export const touchTable: SxProps<Theme> = {
  '& .MuiTableCell-root': {
    padding: { xs: 1.5, sm: 2 },
  },
  '& .MuiIconButton-root': {
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
  },
};

/**
 * Safe area insets for notched phones
 */
export const safeAreaPadding: SxProps<Theme> = {
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
};

export default {
  TOUCH_TARGET_SIZE,
  touchFriendlyButton,
  touchFriendlyIconButton,
  touchFriendlyInput,
  touchFriendlyCheckbox,
  mobileCard,
  mobileDialogContent,
  mobileDialogActions,
  responsiveColumns,
  responsiveSpacing,
  responsivePadding,
  fullWidthOnMobile,
  stackOnMobile,
  hideOnMobile,
  showOnlyMobile,
  preventIOSZoom,
  touchTable,
  safeAreaPadding,
};

