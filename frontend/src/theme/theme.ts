import { createTheme, ThemeOptions } from '@mui/material/styles';

/**
 * Material-UI Theme Configuration
 * 
 * Professional theme for Electrical Construction PM System
 * - Primary: Professional Blue
 * - Secondary: Gray
 * - Clean, modern aesthetic
 * - Responsive design
 */

// Color Palette
const colors = {
  // Primary - Professional Blue
  primary: {
    main: '#1976d2', // Professional blue
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  // Secondary - Gray
  secondary: {
    main: '#546e7a', // Blue-gray
    light: '#78909c',
    dark: '#37474f',
    contrastText: '#ffffff',
  },
  // Error - Red
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  // Warning - Orange
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  // Info - Light Blue
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
  },
  // Success - Green
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
  // Background
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  // Text
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  // Divider
  divider: 'rgba(0, 0, 0, 0.12)',
};

// Typography
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
    textTransform: 'none' as const, // Remove uppercase transformation
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

// Responsive Breakpoints
const breakpoints = {
  values: {
    xs: 0,     // Mobile
    sm: 600,   // Tablet
    md: 960,   // Small laptop
    lg: 1280,  // Desktop
    xl: 1920,  // Large desktop
  },
};

// Spacing (8px base)
const spacing = 8;

// Shape (border radius)
const shape = {
  borderRadius: 8,
};

// Component Style Overrides
const components = {
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
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        '&:hover': {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
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
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
      },
      elevation2: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      },
      elevation3: {
        boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.12)',
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
          borderColor: colors.primary.main,
        },
      },
      notchedOutline: {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: 'rgba(0, 0, 0, 0.6)',
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
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      },
      head: {
        fontWeight: 600,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
        backgroundColor: 'rgba(0, 0, 0, 0.87)',
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
        backgroundColor: '#f1f8f4',
        color: '#1b5e20',
      },
      standardError: {
        backgroundColor: '#fef0f0',
        color: '#c62828',
      },
      standardWarning: {
        backgroundColor: '#fff8e1',
        color: '#e65100',
      },
      standardInfo: {
        backgroundColor: '#e3f2fd',
        color: '#01579b',
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
};

// Shadows (custom)
const shadows = [
  'none',
  '0px 2px 4px rgba(0, 0, 0, 0.08)',
  '0px 4px 8px rgba(0, 0, 0, 0.1)',
  '0px 6px 12px rgba(0, 0, 0, 0.12)',
  '0px 8px 16px rgba(0, 0, 0, 0.14)',
  '0px 10px 20px rgba(0, 0, 0, 0.16)',
  '0px 12px 24px rgba(0, 0, 0, 0.18)',
  '0px 14px 28px rgba(0, 0, 0, 0.2)',
  '0px 16px 32px rgba(0, 0, 0, 0.22)',
  '0px 18px 36px rgba(0, 0, 0, 0.24)',
  '0px 20px 40px rgba(0, 0, 0, 0.26)',
  '0px 22px 44px rgba(0, 0, 0, 0.28)',
  '0px 24px 48px rgba(0, 0, 0, 0.3)',
  '0px 26px 52px rgba(0, 0, 0, 0.32)',
  '0px 28px 56px rgba(0, 0, 0, 0.34)',
  '0px 30px 60px rgba(0, 0, 0, 0.36)',
  '0px 32px 64px rgba(0, 0, 0, 0.38)',
  '0px 34px 68px rgba(0, 0, 0, 0.4)',
  '0px 36px 72px rgba(0, 0, 0, 0.42)',
  '0px 38px 76px rgba(0, 0, 0, 0.44)',
  '0px 40px 80px rgba(0, 0, 0, 0.46)',
  '0px 42px 84px rgba(0, 0, 0, 0.48)',
  '0px 44px 88px rgba(0, 0, 0, 0.5)',
  '0px 46px 92px rgba(0, 0, 0, 0.52)',
  '0px 48px 96px rgba(0, 0, 0, 0.54)',
];

// Create theme options
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    success: colors.success,
    background: colors.background,
    text: colors.text,
    divider: colors.divider,
  },
  typography,
  breakpoints,
  spacing,
  shape,
  components,
  shadows: shadows as any,
};

// Create the theme
const theme = createTheme(themeOptions);

export default theme;

