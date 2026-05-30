import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

const normalize = (url) => (url || '').replace(/\/+$/, '');
const API_URL = normalize(import.meta.env.VITE_API_V2_BASE || '/api/v2');

// Los tokens ya no se guardan en localStorage — el servidor los setea
// como cookies HttpOnly. El frontend solo trackea si hay sesión activa.
const SESSION_KEY = 'cfp_session';

const login = async (username, password) => {
    try {
        const response = await axios.post(
            `${API_URL}/token`,
            { username, password },
            { withCredentials: true }
        );
        sessionStorage.setItem(SESSION_KEY, '1');
        return response.data;
    } catch (err) {
        throw new Error(handleApiError(err, 'Error al iniciar sesión'));
    }
};

const refresh = async () => {
    try {
        const response = await axios.post(
            `${API_URL}/token/refresh`,
            {},
            { withCredentials: true }
        );
        return response.data;
    } catch (err) {
        throw new Error(handleApiError(err, 'Error al refrescar la sesión'));
    }
};

const getUserDetails = async () => {
    try {
        const response = await axios.get(`${API_URL}/user`, { withCredentials: true });
        return response.data;
    } catch {
        return null;
    }
};

const logout = async () => {
    try {
        await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
    } catch {
        // ignorar errores del servidor
    } finally {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
};

const isLoggedIn = () => sessionStorage.getItem(SESSION_KEY) === '1';

const getAccessToken = () => null;
const getRefreshToken = () => null;

const authService = {
    login,
    refresh,
    getUserDetails,
    logout,
    isLoggedIn,
    getAccessToken,
    getRefreshToken,
};

export default authService;
