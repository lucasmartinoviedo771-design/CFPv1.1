/// <reference types="vite/client" />
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import type { LoginResponse, UserDetails } from '../api/types';

const normalize = (url: string | undefined): string => (url || '').replace(/\/+$/, '');
const API_URL = normalize(import.meta.env.VITE_API_V2_BASE || '/api/v2');

// Los tokens ya no se guardan en localStorage — el servidor los setea
// como cookies HttpOnly. El frontend solo trackea si hay sesión activa.
const SESSION_KEY = 'cfp_session';

const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await axios.post<LoginResponse>(
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

const refresh = async (): Promise<unknown> => {
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

const getUserDetails = async (): Promise<UserDetails | null> => {
    try {
        const response = await axios.get<UserDetails>(`${API_URL}/user`, { withCredentials: true });
        return response.data;
    } catch {
        return null;
    }
};

const logout = async (): Promise<void> => {
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

const isLoggedIn = (): boolean => sessionStorage.getItem(SESSION_KEY) === '1';

const getAccessToken = (): null => null;
const getRefreshToken = (): null => null;

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
