import axios from 'axios';
import { useStore } from '../store/useStore.ts';

// Configured for local development or docker container routing
const API_BASE_URL = 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Auto-attach security Bearer tokens to request headers
api.interceptors.request.use((config: any) => {
  const token = useStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error: any) => {
  return Promise.reject(error);
});

// Global response parsing and error normalizer
api.interceptors.response.use(
  (response: any) => response.data,
  async (error: any) => {
    const originalRequest = error.config;
    
    // Auto-refresh token rotation if access token expires
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = refreshResponse.data.data.token;
        
          useStore.getState().setToken(newToken);
        
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Force logout if refresh token expires
        useStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
