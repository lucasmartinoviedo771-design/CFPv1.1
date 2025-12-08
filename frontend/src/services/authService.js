
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

/**
 * Inicia sesión y almacena los tokens en sessionStorage
 * @param {string} username - Nombre de usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Datos de respuesta con tokens
 */
// Hardcoded backend URL to bypass Vite Proxy issues
const API_URL = 'http://127.0.0.1:8000';

const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/api/token/`, {
            username,
            password,
        });
        if (response.data.access) {
            sessionStorage.setItem('accessToken', response.data.access);
            sessionStorage.setItem('refreshToken', response.data.refresh);
        }
        return response.data;
    } catch (err) {
        throw new Error(handleApiError(err, 'Error al iniciar sesión'));
    }
};

/**
 * Refresca el token de acceso usando el refresh token
 * @param {string} refreshToken - Token de refresco
 * @returns {Promise<string>} Nuevo token de acceso
 */
const refresh = async (refreshToken) => {
    try {
        const response = await axios.post(`${API_URL}/api/token/refresh/`, {
            refresh: refreshToken,
        });
        if (response.data.access) {
            sessionStorage.setItem('accessToken', response.data.access);
        }
        return response.data.access;
    } catch (err) {
        throw new Error(handleApiError(err, 'Error al refrescar la sesión'));
    }
};

/**
 * Obtiene los detalles del usuario autenticado
 * @returns {Promise<Object|null>} Datos del usuario o null si hay error
 */
const getUserDetails = async () => {
    try {
        const token = getAccessToken();
        const response = await axios.get(`${API_URL}/api/user/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return response.data;
    } catch (err) {
        // Silently ignore aborted/canceled requests to avoid noisy logs during redirects
        if (err?.code === 'ECONNABORTED' || err?.message === 'Request aborted') {
            return null;
        }
        return null;
    }
};

/**
 * Cierra la sesión del usuario
 */
const logout = async () => {
    try {
        const refresh = sessionStorage.getItem('refreshToken');
        if (refresh) {
            await axios.post(`${API_URL}/api/logout/`, { refresh });
        }
    } catch (e) {
        // Ignore server-side logout errors; proceed to clear local state
    } finally {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
    }
};

/**
 * Obtiene el token de acceso almacenado
 * @returns {string|null} Token de acceso
 */
const getAccessToken = () => {
    return sessionStorage.getItem('accessToken');
};

/**
 * Obtiene el token de refresco almacenado
 * @returns {string|null} Token de refresco
 */
const getRefreshToken = () => {
    return sessionStorage.getItem('refreshToken');
};

const authService = {
    login,
    refresh,
    getUserDetails,
    logout,
    getAccessToken,
    getRefreshToken,
};

export default authService;
