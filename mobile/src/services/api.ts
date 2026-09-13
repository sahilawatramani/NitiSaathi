/**
 * API Service — Axios client configured for NitiSaathi backend.
 *
 * Base URL points to the FastAPI backend running locally.
 * For physical device testing, replace with your machine's LAN IP,
 * e.g. http://192.168.1.x:8000
 */
import axios from 'axios';
import { secureStorage } from './secureStorage';

// ngrok tunnel — works from any device/network without firewall changes
export const API_BASE_URL = 'https://confidant-dehydrate-sublime.ngrok-free.dev/api';
// export const API_BASE_URL = 'http://192.168.1.6:8000/api'; // LAN (same WiFi only)
// export const API_BASE_URL = 'http://10.0.2.2:8000/api';    // Android emulator only
// export const API_BASE_URL = 'http://localhost:8000/api';    // Web / iOS sim

export const TOKEN_KEY = 'nitisaathi_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90s — covers Gemini API (60s hard limit) + network overhead
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok browser warning
  },
});

// Request interceptor — attach JWT token from secure storage
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await secureStorage.deleteItem(TOKEN_KEY);
      // The AuthContext will detect the missing token and redirect to Login
    }
    return Promise.reject(error);
  }
);

export default api;
