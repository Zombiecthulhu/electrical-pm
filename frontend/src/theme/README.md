# Theme Configuration

This directory contains the Material-UI theme configuration for the Electrical Construction PM System.

## Overview

The theme provides a consistent, professional look and feel across the entire application with:
- **Professional blue** primary color scheme
- **Gray** secondary color scheme  
- Clean typography
- Responsive breakpoints
- Comprehensive component style overrides

## Files

- `theme.ts` - Main theme configuration
- `index.ts` - Theme exports

## Color Palette

### Primary (Professional Blue)
- **Main**: `#1976d2` - Professional, trustworthy blue
- **Light**: `#42a5f5` - Lighter shade for hover states
- **Dark**: `#1565c0` - Darker shade for active states
- **Contrast**: `#ffffff` - White text on blue

### Secondary (Blue-Gray)
- **Main**: `#546e7a` - Neutral gray with blue tint
- **Light**: `#78909c` - Lighter gray
- **Dark**: `#37474f` - Darker gray
- **Contrast**: `#ffffff` - White text

### Supporting Colors
- **Error**: Red (`#d32f2f`) - For errors and destructive actions
- **Warning**: Orange (`#ed6c02`) - For warnings
- **Info**: Light Blue (`#0288d1`) - For informational messages
- **Success**: Green (`#2e7d32`) - For success states

### Background
- **Default**: `#f5f5f5` - Light gray page background
- **Paper**: `#ffffff` - White surface color

### Text
- **Primary**: `rgba(0, 0, 0, 0.87)` - Main text color
- **Secondary**: `rgba(0, 0, 0, 0.6)` - Secondary text
- **Disabled**: `rgba(0, 0, 0, 0.38)` - Disabled text

## Typography

### Font Family
System font stack for optimal performance and native feel:
- -apple-system (macOS/iOS)
- BlinkMacSystemFont (macOS/iOS)
- Segoe UI (Windows)
- Roboto (Android)
- Helvetica Neue (fallback)
- Arial (fallback)

### Font Sizes
- **h1**: 2.5rem (40px) - Page titles
- **h2**: 2rem (32px) - Section titles
- **h3**: 1.75rem (28px) - Subsection titles
- **h4**: 1.5rem (24px) - Card titles
- **h5**: 1.25rem (20px) - List headers
- **h6**: 1rem (16px) - Small headers
- **body1**: 1rem (16px) - Primary body text
- **body2**: 0.875rem (14px) - Secondary body text
- **button**: 0.875rem (14px) - Button text
- **caption**: 0.75rem (12px) - Small text
- **overline**: 0.75rem (12px) - Overline text

### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Bold**: 700

## Responsive Breakpoints

```typescript
xs: 0px      // Mobile (phone)
sm: 600px    // Tablet (portrait)
md: 960px    // Small laptop
lg: 1280px   // Desktop
xl: 1920px   // Large desktop
```

### Usage
```typescript
import { useMediaQuery, useTheme } from '@mui/material';

const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
```

## Spacing System

Based on 8px grid:
- `theme.spacing(1)` = 8px
- `theme.spacing(2)` = 16px
- `theme.spacing(3)` = 24px
- `theme.spacing(4)` = 32px
- etc.

### Usage
```typescript
import { Box } from '@mui/material';

<Box sx={{ p: 2, m: 3 }}>  {/* padding: 16px, margin: 24px */}
  Content
</Box>
```

## Shape & Border Radius

**Default Border Radius**: 8px

### Usage
```typescript
<Box sx={{ borderRadius: 1 }}>  {/* 8px */}
<Box sx={{ borderRadius: 2 }}>  {/* 16px */}
```

## Component Style Overrides

### Button
- Border radius: 8px
- No text transform (preserves case)
- Subtle shadows
- Hover effects

### Card
- Border radius: 12px
- Soft shadow
- Hover shadow effect

### TextField
- Border radius: 8px
- Outlined variant by default
- Blue hover state

### Paper
- Border radius: 8px
- Custom elevation shadows

### Alert
- Border radius: 8px
- Custom background colors
- Clear color coding

### Table
- Hover row effect
- Bold column headers
- Subtle borders

### Dialog
- Larger title text
- Consistent padding

## Usage Examples

### Basic Setup
```typescript
// App.tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <YourApp />
    </ThemeProvider>
  );
}
```

### Using Theme Colors
```typescript
import { Button, Box } from '@mui/material';

// Using theme colors
<Button color="primary">Primary Button</Button>
<Button color="secondary">Secondary Button</Button>

// Using sx prop
<Box sx={{ 
  backgroundColor: 'primary.main',
  color: 'primary.contrastText',
  p: 2 
}}>
  Content
</Box>
```

### Using Typography
```typescript
import { Typography } from '@mui/material';

<Typography variant="h1">Page Title</Typography>
<Typography variant="h2">Section Title</Typography>
<Typography variant="body1">Body text</Typography>
<Typography variant="caption">Small text</Typography>
```

### Responsive Design
```typescript
import { Box, Typography } from '@mui/material';

<Box sx={{
  width: { xs: '100%', sm: '80%', md: '60%' },  // Responsive width
  p: { xs: 2, sm: 3, md: 4 },                   // Responsive padding
}}>
  <Typography variant={{ xs: 'h3', md: 'h1' }}>  {/* Responsive variant */}
    Responsive Title
  </Typography>
</Box>
```

### Custom Styling with Theme
```typescript
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      padding: theme.spacing(3),
      borderRadius: theme.shape.borderRadius,
      [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
      },
    }}>
      Content
    </Box>
  );
};
```

## Customization

### Adding New Colors
```typescript
// In theme.ts
const colors = {
  // ... existing colors
  accent: {
    main: '#ff6b35',
    light: '#ff8c5a',
    dark: '#c74a1f',
  },
};
```

### Overriding Component Styles
```typescript
// In theme.ts components section
MuiButton: {
  styleOverrides: {
    root: {
      // Your custom styles
    },
  },
},
```

### Creating Dark Theme
```typescript
// Create a dark mode variant
const darkTheme = createTheme({
  ...themeOptions,
  palette: {
    ...themeOptions.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});
```

## Theme Switching (Future)

To implement light/dark mode toggle:

```typescript
// Store theme mode in state or context
const [mode, setMode] = useState<'light' | 'dark'>('light');

const theme = useMemo(
  () => createTheme({
    palette: {
      mode,
      // ... rest of palette
    },
  }),
  [mode]
);

// Toggle function
const toggleTheme = () => {
  setMode(prev => prev === 'light' ? 'dark' : 'light');
};
```

## Best Practices

### Do:
✅ Use theme values instead of hardcoded colors  
✅ Use spacing system for consistent gaps  
✅ Use responsive breakpoints for mobile-first design  
✅ Use typography variants for text hierarchy  
✅ Test on different screen sizes  

### Don't:
❌ Don't hardcode colors or spacing  
❌ Don't ignore responsive design  
❌ Don't override too many component styles  
❌ Don't use inline styles when theme values exist  

## Resources

- [Material-UI Theming](https://mui.com/material-ui/customization/theming/)
- [Material-UI Default Theme](https://mui.com/material-ui/customization/default-theme/)
- [Color Tool](https://m2.material.io/resources/color/)
- [Typography Tool](https://m2.material.io/design/typography/the-type-system.html)

---

**Theme Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Production Ready

