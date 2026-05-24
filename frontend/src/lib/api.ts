import axios from 'axios';
import { useStore } from '../store/useStore';

// In production (Vercel), VITE_API_URL points to the Render backend
// In development, Vite proxy rewrites /api/v1 → localhost:5000/api/v1
const PROD_URL = 'https://kemet-flights-backend.onrender.com';
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_URL : '/api/v1');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't clear token during auth endpoints themselves
      if (!url.includes('/auth/')) {
        useStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
