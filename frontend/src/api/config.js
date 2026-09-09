import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// Microservice base URLs — separate FastAPI processes on different ports.
// Override via .env for physical devices / staging / production.
export const SCHEME_BASE_URL = process.env.EXPO_PUBLIC_SCHEME_URL || 'http://localhost:8001';
export const FRAUD_BASE_URL = process.env.EXPO_PUBLIC_FRAUD_URL || 'http://localhost:8002';

export const TOKEN_KEY = 'nitisaathi_jwt_token';

export const storeToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (e) {
    console.error('Error storing token', e);
  }
};

export const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Error getting token', e);
    return null;
  }
};

export const clearToken = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Error clearing token', e);
  }
};

export const apiFetch = async (path, options = {}) => {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 
      'Content-Type': 'application/json', 
      ...(token ? { Authorization: `Bearer ${token}` } : {}), 
      ...options.headers 
    }
  });
  if (!res.ok) { 
    if (res.status === 401) {
      await clearToken();
    }
    const err = await res.json().catch(() => ({})); 
    let msg = `HTTP ${res.status}`;
    if (typeof err.detail === 'string') {
      msg = err.detail;
    } else if (Array.isArray(err.detail)) {
      msg = err.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    } else if (err.detail && typeof err.detail === 'object') {
      msg = JSON.stringify(err.detail);
    }
    throw new Error(msg); 
  }
  return res.json();
};

export const apiDownload = async (path) => {
  const token = await getToken();
  return fetch(`${API_BASE_URL}${path}`, { 
    headers: { 
      ...(token ? { Authorization: `Bearer ${token}` } : {}) 
    } 
  });
};
