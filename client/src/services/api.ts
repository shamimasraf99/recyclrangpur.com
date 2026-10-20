import axios from 'axios';

const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
export const API_BASE_URL = (metaEnv?.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Request interceptor: attach Bearer token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bikroybd_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 token expiration via refresh endpoint & extract API error message cleanly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Attempt automatic token rotation once on 401 Unauthorized (excluding login/register/refresh endpoints)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url || '').includes('/auth/login') &&
      !String(originalRequest.url || '').includes('/auth/register') &&
      !String(originalRequest.url || '').includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/auth/refresh` : '/api/v1/auth/refresh';
        const refreshRes = await axios.post(
          refreshUrl,
          {},
          { withCredentials: true, headers: { 'X-Requested-With': 'XMLHttpRequest' } }
        );
        const newAccessToken = refreshRes.data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('bikroybd_token', newAccessToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('bikroybd_token');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
      }
    }

    const apiError = error.response?.data?.error;
    if (apiError) {
      error.message = apiError.message || error.message;
    }
    return Promise.reject(error);
  }
);
