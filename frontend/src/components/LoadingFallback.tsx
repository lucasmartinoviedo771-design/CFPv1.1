import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Cargando módulo...',
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="60vh"
      width="100%"
      gap={2}
      sx={{
        animation: 'fadeIn 0.25s ease-in-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <CircularProgress size={40} thickness={4} color="primary" />
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingFallback;
