import { AxiosError } from 'axios';

/**
 * Utilidad para manejar errores de API de forma centralizada
 */

interface BackendErrorData {
  detail?: string;
  message?: string;
  errors?: Record<string, string | string[]>;
  [key: string]: any; // Allow indexing if needed, but not using any directly for variables
}

/**
 * Extrae un mensaje de error legible desde un objeto de error de Axios
 * @param {unknown} error - Objeto de error
 * @param {string} defaultMessage - Mensaje por defecto si no se puede extraer uno
 * @returns {string} Mensaje de error formateado
 */
export const handleApiError = (error: unknown, defaultMessage: string = 'Ha ocurrido un error'): string => {
    // Error de respuesta del servidor (4xx, 5xx)
    if (error && typeof error === 'object' && 'isAxiosError' in error && (error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError<BackendErrorData>;
        if (axiosError.response) {
            const data = axiosError.response.data;
            const status = axiosError.response.status;

            // Manejar diferentes formatos de error del backend
            if (typeof data === 'string') {
                return data;
            }

            if (data) {
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
            }

            // Error genérico con código de estado
            return `Error ${status}: ${defaultMessage}`;
        }

        // Error de red (sin respuesta del servidor)
        if (axiosError.request) {
            return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
        }

        // Otro tipo de error (problema en el código del cliente)
        return axiosError.message || defaultMessage;
    }

    if (error instanceof Error) {
        return error.message || defaultMessage;
    }

    return defaultMessage;
};

/**
 * Muestra un error en la consola (puede extenderse para usar notificaciones)
 * @param {unknown} error - Objeto de error
 * @param {string} defaultMessage - Mensaje por defecto
 * @returns {string} Mensaje de error
 */
export const showErrorNotification = (error: unknown, defaultMessage: string): string => {
    const message = handleApiError(error, defaultMessage);
    console.error('❌ Error:', message);
    // TODO: Integrar con sistema de notificaciones (ej: toast, snackbar)
    return message;
};

/**
 * Verifica si un error es de autenticación (401)
 * @param {unknown} error - Objeto de error
 * @returns {boolean}
 */
export const isAuthError = (error: unknown): boolean => {
    if (error && typeof error === 'object' && 'isAxiosError' in error && (error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError;
        return !!(axiosError.response && axiosError.response.status === 401);
    }
    return false;
};

/**
 * Verifica si un error es de permisos (403)
 * @param {unknown} error - Objeto de error
 * @returns {boolean}
 */
export const isPermissionError = (error: unknown): boolean => {
    if (error && typeof error === 'object' && 'isAxiosError' in error && (error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError;
        return !!(axiosError.response && axiosError.response.status === 403);
    }
    return false;
};

/**
 * Verifica si un error es de validación (400)
 * @param {unknown} error - Objeto de error
 * @returns {boolean}
 */
export const isValidationError = (error: unknown): boolean => {
    if (error && typeof error === 'object' && 'isAxiosError' in error && (error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError;
        return !!(axiosError.response && axiosError.response.status === 400);
    }
    return false;
};
