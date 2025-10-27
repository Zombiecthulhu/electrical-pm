import { createTheme, ThemeOptions, Theme } from '@mui/material/styles';
import { ThemeVariant, ThemeMode } from '../store/theme.store';

/**
 * Material-UI Theme Configuration
 * 
 * Multiple theme variants for Electrical Construction PM System
 * - Professional Blue: Clean, corporate look
 * - Electrical Orange: High-visibility for field work
 * - Forest Green: Natural, calming theme
 * - Dark Mode: Dark background with light text
 */

// Base color palettes for each theme variant
const colorPalettes = {
  'professional-blue': {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#546e7a',
      light: '#78909c',
      dark: '#37474f',
      contrastText: '#ffffff',
    },
  },
  'electrical-orange': {
    primary: {
      main: '#ff6f00',
      light: '#ff8f00',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#ffffff',
    },
  },
  'forest-green': {
    primary: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
  },
  'dark-mode': {
    primary: {
      main: '#90caf9',
      light: '#bbdefb',
      dark: '#42a5f5',
      contrastText: '#000000',
    },
    secondary: {
      main: '#f48fb1',
      light: '#f8bbd9',
      dark: '#c2185b',
      contrastText: '#000000',
    },
  },
  'inman-knight': {
    primary: {
      main: '#1a237e', // Dark blue
      light: '#3949ab',
      dark: '#0d1421',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffd700', // Gold/Yellow
      light: '#ffeb3b',
      dark: '#f57f17',
      contrastText: '#000000',
    },
  },
};

// Common colors (same for all themes)
const commonColors = {
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
};

// Light mode background and text colors
const lightModeColors = {
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

// Dark mode background and text colors
const darkModeColors = {
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.87)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.38)',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
};

// Typography configuration
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'none' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase' as const,
  },
};

// Responsive breakpoints
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};

// Spacing (8px base)
const spacing = 8;

// Shape (border radius)
const shape = {
  borderRadius: 8,
};

// Component style overrides
const getComponentOverrides = (isDark: boolean) => ({
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none' as const,
        fontWeight: 500,
        padding: '8px 16px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
      contained: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
        },
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '1rem',
      },
      sizeSmall: {
        padding: '6px 12px',
        fontSize: '0.8125rem',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: isDark 
          ? '0px 2px 8px rgba(0, 0, 0, 0.3)'
          : '0px 2px 8px rgba(0, 0, 0, 0.08)',
        '&:hover': {
          boxShadow: isDark
            ? '0px 4px 12px rgba(0, 0, 0, 0.4)'
            : '0px 4px 12px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      elevation1: {
        boxShadow: isDark
          ? '0px 2px 4px rgba(0, 0, 0, 0.3)'
          : '0px 2px 4px rgba(0, 0, 0, 0.08)',
      },
      elevation2: {
        boxShadow: isDark
          ? '0px 4px 8px rgba(0, 0, 0, 0.4)'
          : '0px 4px 8px rgba(0, 0, 0, 0.1)',
      },
      elevation3: {
        boxShadow: isDark
          ? '0px 6px 12px rgba(0, 0, 0, 0.5)'
          : '0px 6px 12px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
    defaultProps: {
      variant: 'outlined' as const,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: isDark ? '#90caf9' : '#1976d2',
        },
      },
      notchedOutline: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        fontWeight: 500,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: isDark
          ? '0px 1px 3px rgba(0, 0, 0, 0.5)'
          : '0px 1px 3px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: isDark
          ? '1px solid rgba(255, 255, 255, 0.12)'
          : '1px solid rgba(0, 0, 0, 0.12)',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: isDark
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid rgba(0, 0, 0, 0.08)',
      },
      head: {
        fontWeight: 600,
        backgroundColor: isDark
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(0, 0, 0, 0.02)',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)',
        color: isDark ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.87)',
        fontSize: '0.75rem',
        borderRadius: 4,
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      standardSuccess: {
        backgroundColor: isDark ? '#1b5e20' : '#f1f8f4',
        color: isDark ? '#a5d6a7' : '#1b5e20',
      },
      standardError: {
        backgroundColor: isDark ? '#c62828' : '#fef0f0',
        color: isDark ? '#ffcdd2' : '#c62828',
      },
      standardWarning: {
        backgroundColor: isDark ? '#e65100' : '#fff8e1',
        color: isDark ? '#ffe0b2' : '#e65100',
      },
      standardInfo: {
        backgroundColor: isDark ? '#01579b' : '#e3f2fd',
        color: isDark ? '#b3e5fc' : '#01579b',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        padding: 8,
      },
      switchBase: {
        padding: 11,
      },
    },
  },
});

// Create theme function
export const createAppTheme = (variant: ThemeVariant, mode: ThemeMode): Theme => {
  const isDark = mode === 'dark';
  const palette = colorPalettes[variant];
  const backgroundColors = isDark ? darkModeColors : lightModeColors;

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: palette.primary,
      secondary: palette.secondary,
      error: commonColors.error,
      warning: commonColors.warning,
      info: commonColors.info,
      success: commonColors.success,
      background: backgroundColors.background,
      text: backgroundColors.text,
      divider: backgroundColors.divider,
    },
    typography,
    breakpoints,
    spacing,
    shape,
    components: getComponentOverrides(isDark),
  };

  return createTheme(themeOptions);
};

// Default theme (Professional Blue, Light mode)
const defaultTheme = createAppTheme('professional-blue', 'light');

export default defaultTheme;