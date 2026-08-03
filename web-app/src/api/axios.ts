import axios from 'axios';
import { API_BASE_URL } from '@/constants';
import { storage } from '@/utils';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = storage.get('token') || storage.get('aura-auth')?.state?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.remove('token');
      storage.remove('user');
      storage.remove('aura-auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
