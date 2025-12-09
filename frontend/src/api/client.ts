import axios from 'axios';
import authService from '../services/authService';

// Cliente único para API v2 con manejo de token/refresh.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_V2_BASE || '/api/v2',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  (config) => {
    const url = config?.url || '';
    const isAuthRoute = url.includes('/token');
    const token = authService.getAccessToken();
    if (!isAuthRoute && token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

    if (status === 401 && !isRefreshCall && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          const newAccessToken = await authService.refresh(refreshToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
        authService.logout();
        window.location.href = '/login';
      } catch (refreshError) {
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const apiClientV2 = apiClient;
export default apiClient;
