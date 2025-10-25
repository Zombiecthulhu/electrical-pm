/**
 * useResponsive Hook
 * 
 * Custom hooks for responsive design and screen size detection.
 * Provides easy-to-use hooks for mobile, tablet, and desktop views.
 */

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Breakpoint } from '@mui/material/styles';

/**
 * Check if current viewport is mobile (xs: 0-599px)
 */
export const useMobileView = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
};

/**
 * Check if current viewport is tablet (sm-md: 600-1199px)
 */
export const useTabletView = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.between('sm', 'lg'));
};

/**
 * Check if current viewport is desktop (lg+: 1200px+)
 */
export const useDesktopView = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up('lg'));
};

/**
 * Check if viewport is mobile or tablet (< 1200px)
 */
export const useSmallScreen = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('lg'));
};

/**
 * Check if viewport is mobile or small tablet (< 900px)
 */
export const useCompactView = (): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
};

/**
 * Get current breakpoint name
 */
export const useBreakpoint = (): Breakpoint => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  
  if (isXs) return 'xs';
  if (isSm) return 'sm';
  if (isMd) return 'md';
  if (isLg) return 'lg';
  return 'xl';
};

/**
 * Check if viewport width is above a specific breakpoint
 */
export const useBreakpointUp = (breakpoint: Breakpoint): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.up(breakpoint));
};

/**
 * Check if viewport width is below a specific breakpoint
 */
export const useBreakpointDown = (breakpoint: Breakpoint): boolean => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down(breakpoint));
};

/**
 * Get device orientation
 */
export const useOrientation = (): 'portrait' | 'landscape' => {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
};

/**
 * Check if device is touch-enabled
 */
export const useTouchDevice = (): boolean => {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
};

/**
 * Get responsive value based on current breakpoint
 * 
 * @example
 * const columns = useResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 });
 */
export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
  const breakpoint = useBreakpoint();
  
  // Try to get exact breakpoint value
  if (values[breakpoint] !== undefined) {
    return values[breakpoint];
  }
  
  // Fall back to nearest smaller breakpoint
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);
  
  for (let i = currentIndex - 1; i >= 0; i--) {
    const fallbackBreakpoint = breakpointOrder[i];
    if (values[fallbackBreakpoint] !== undefined) {
      return values[fallbackBreakpoint];
    }
  }
  
  return undefined;
};

/**
 * All responsive utilities in one object
 */
export const useResponsive = () => {
  return {
    isMobile: useMobileView(),
    isTablet: useTabletView(),
    isDesktop: useDesktopView(),
    isSmallScreen: useSmallScreen(),
    isCompactView: useCompactView(),
    breakpoint: useBreakpoint(),
    orientation: useOrientation(),
    isTouchDevice: useTouchDevice(),
  };
};

export default useResponsive;

