import axios from 'axios';
import { useStore } from '../store/useStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired or invalid/fake token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't clear token during the auth endpoints themselves
      if (!url.includes('/auth/')) {
        useStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
