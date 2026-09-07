import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createSession as mockCreateSession, logoutSession as mockLogoutSession } from '../api/auth';

interface AuthContextType {
  session: any | null;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any | null>(null);

  const login = async (userData: any) => {
    try {
      const response = await mockCreateSession(userData);
      if (response && response.success) {
        setSession(response);
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await mockLogoutSession();
      setSession(null);
    } catch (error) {
      console.error('Logout failed', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
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
