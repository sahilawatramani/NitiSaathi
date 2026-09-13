/**
 * AuthContext — provides authentication state throughout the app.
 *
 * Stores the JWT token in expo-secure-store.
 * On boot, tries to load existing token and calls /auth/me to validate.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authService, UserMe } from '../services/authService';

type Language = 'hi' | 'en' | 'mr';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserMe | null;
  token: string | null;
  language: Language;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (lang: Language) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
    language: 'hi',
  });

  // On mount — check for existing session
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await authService.getToken();
        if (savedToken) {
          const user = await authService.me();
          setState((s) => ({
            ...s,
            isAuthenticated: true,
            user,
            token: savedToken,
          }));
        }
      } catch {
        // Token invalid or expired — stay logged out
        await authService.clearToken();
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokenData = await authService.login({ email, password });
    await authService.saveToken(tokenData.access_token);
    const user = await authService.me();
    setState((s) => ({
      ...s,
      isAuthenticated: true,
      user,
      token: tokenData.access_token,
    }));
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    await authService.signup({ email, password });
    // Auto-login after signup
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    await authService.clearToken();
    setState((s) => ({
      ...s,
      isAuthenticated: false,
      user: null,
      token: null,
    }));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setState((s) => ({ ...s, language: lang }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, setLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
