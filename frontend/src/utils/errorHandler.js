/**
 * Utilidad para manejar errores de API de forma centralizada
 */

/**
 * Extrae un mensaje de error legible desde un objeto de error de Axios
 * @param {Error} error - Error de Axios
 * @param {string} defaultMessage - Mensaje por defecto si no se puede extraer uno
 * @returns {string} Mensaje de error formateado
 */
export const handleApiError = (error, defaultMessage = 'Ha ocurrido un error') => {
    // Error de respuesta del servidor (4xx, 5xx)
    if (error.response) {
        const data = error.response.data;
        const status = error.response.status;

        // Manejar diferentes formatos de error del backend
        if (typeof data === 'string') {
            return data;
        }

        // Formato Django REST Framework
        if (data.detail) {
            return data.detail;
        }

        if (data.message) {
            return data.message;
        }

        // Errores de validación (múltiples campos)
        if (data.errors && typeof data.errors === 'object') {
            const errors = Object.entries(data.errors)
                .map(([field, messages]) => {
                    const msgArray = Array.isArray(messages) ? messages : [messages];
                    return `${field}: ${msgArray.join(', ')}`;
                })
                .join('; ');
            return errors;
        }

        // Errores de validación (array simple)
        if (Array.isArray(data)) {
            return data.join(', ');
        }

        // Error genérico con código de estado
        return `Error ${status}: ${defaultMessage}`;
    }

    // Error de red (sin respuesta del servidor)
    if (error.request) {
        return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }

    // Otro tipo de error (problema en el código del cliente)
    return error.message || defaultMessage;
};

/**
 * Muestra un error en la consola (puede extenderse para usar notificaciones)
 * @param {Error} error - Error de Axios
 * @param {string} defaultMessage - Mensaje por defecto
 * @returns {string} Mensaje de error
 */
export const showErrorNotification = (error, defaultMessage) => {
    const message = handleApiError(error, defaultMessage);
    console.error('❌ Error:', message);
    // TODO: Integrar con sistema de notificaciones (ej: toast, snackbar)
    return message;
};

/**
 * Verifica si un error es de autenticación (401)
 * @param {Error} error - Error de Axios
 * @returns {boolean}
 */
export const isAuthError = (error) => {
    return error.response && error.response.status === 401;
};

/**
 * Verifica si un error es de permisos (403)
 * @param {Error} error - Error de Axios
 * @returns {boolean}
 */
export const isPermissionError = (error) => {
    return error.response && error.response.status === 403;
};

/**
 * Verifica si un error es de validación (400)
 * @param {Error} error - Error de Axios
 * @returns {boolean}
 */
export const isValidationError = (error) => {
    return error.response && error.response.status === 400;
};
