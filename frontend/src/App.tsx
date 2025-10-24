import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Typography } from '@mui/material';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline for consistent baseline styles */}
      <CssBaseline />
      
      <Container maxWidth="lg">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h1"
            color="primary"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            Welcome
          </Typography>
          
          <Typography
            variant="h4"
            color="text.secondary"
            gutterBottom
          >
            Electrical Construction Project Management System
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Your project is ready to start building!
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
