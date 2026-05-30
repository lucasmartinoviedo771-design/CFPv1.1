import axios from 'axios';
import authService from '../services/authService';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_V2_BASE || '/api/v2',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // envía cookies HttpOnly en cada request automáticamente
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (error.code === 'ECONNABORTED' || error.message === 'Request aborted') {
      return Promise.reject(error);
    }
    const status = error.response?.status;
    const url = originalRequest.url || '';
    const isRefreshCall = url.includes('/token/refresh');
    const isLoginCall = url.includes('/token');

    if (status === 401 && !isRefreshCall && !isLoginCall && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await authService.refresh();
        return apiClient(originalRequest);
      } catch {
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const apiClientV2 = apiClient;
export default apiClient;
