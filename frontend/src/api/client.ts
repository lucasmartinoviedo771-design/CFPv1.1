import axios from 'axios';

export const apiClientV2 = axios.create({
  baseURL: import.meta.env.VITE_API_V2_BASE || '/api/v2',
  headers: { 'Content-Type': 'application/json' },
});

// Helper for attaching bearer tokens (reuse if needed)
export const withAuth = (token?: string) => {
  const instance = apiClientV2;
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  return instance;
};
