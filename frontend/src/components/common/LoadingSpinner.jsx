import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Componente de loading spinner reutilizable
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar debajo del spinner
 * @param {string} props.size - Tamaño del spinner ('small', 'medium', 'large')
 * @param {string} props.minHeight - Altura mínima del contenedor
 */
function LoadingSpinner({ message = 'Cargando...', size = 'medium', minHeight = '200px' }) {
    const sizeMap = {
        small: 30,
        medium: 40,
        large: 60
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight={minHeight}
            gap={2}
        >
            <CircularProgress size={sizeMap[size]} />
            {message && (
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            )}
        </Box>
    );
}

LoadingSpinner.propTypes = {
    message: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    minHeight: PropTypes.string,
};

export default LoadingSpinner;
