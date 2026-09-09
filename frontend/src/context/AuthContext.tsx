import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth';
import { getToken } from '../api/config';

interface AuthContextType {
  session: any | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  userId?: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const token = await getToken();
      if (token) {
        setSession({ authenticated: true });
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) setUserId(payload.sub);
        } catch (e) {}
      }
    };
    loadSession();
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const data = await apiLogin(email, password || 'default_password');
      setSession({ authenticated: true });
      if (data.access_token) {
        try {
          const payload = JSON.parse(atob(data.access_token.split('.')[1]));
          if (payload.sub) setUserId(payload.sub);
        } catch (e) {}
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const register = async (email: string, password?: string) => {
    try {
      const data = await apiRegister(email, password || 'default_password');
      setSession({ authenticated: true });
      if (data.access_token) {
        try {
          const payload = JSON.parse(atob(data.access_token.split('.')[1]));
          if (payload.sub) setUserId(payload.sub);
        } catch (e) {}
      }
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setSession(null);
      setUserId(null);
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, login, register, logout, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
