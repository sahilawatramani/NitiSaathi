/**
 * Auth Service — wrappers for auth-related API calls.
 */
import api, { TOKEN_KEY } from './api';
import { secureStorage } from './secureStorage';

export interface SignupPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface UserMe {
  id: number;
  email: string;
}

export const authService = {
  signup: async (payload: SignupPayload): Promise<UserMe> => {
    const res = await api.post<UserMe>('/auth/signup', payload);
    return res.data;
  },

  login: async (payload: LoginPayload): Promise<AuthToken> => {
    const res = await api.post<AuthToken>('/auth/login', payload);
    return res.data;
  },

  me: async (): Promise<UserMe> => {
    const res = await api.get<UserMe>('/auth/me');
    return res.data;
  },

  saveToken: async (token: string): Promise<void> => {
    await secureStorage.setItem(TOKEN_KEY, token);
  },

  clearToken: async (): Promise<void> => {
    await secureStorage.deleteItem(TOKEN_KEY);
  },

  getToken: async (): Promise<string | null> => {
    return await secureStorage.getItem(TOKEN_KEY);
  },
};
