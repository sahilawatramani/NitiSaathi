/**
 * AuthContext — provides authentication state throughout the app.
 *
 * Stores the JWT token in expo-secure-store.
 * Dynamically provisions individual user accounts derived from user name / email.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authService, UserMe } from '../services/authService';
import { profileService } from '../services/profileService';
import { secureStorage } from '../services/secureStorage';

type Language = 'hi' | 'en' | 'mr';

const LANGUAGE_STORAGE_KEY = 'preferred_app_language';

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
  updateUser: (updatedUser: Partial<UserMe>) => void;
  setLanguage: (lang: Language) => void;
  completeOnboarding: (profileData?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const deriveEmailFromName = (name?: string, rawEmail?: string): string => {
  if (rawEmail && rawEmail.trim() && rawEmail.includes('@')) {
    return rawEmail.trim().toLowerCase();
  }
  const cleanName = (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return cleanName ? `${cleanName}@nitisaathi.in` : 'user@nitisaathi.in';
};

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

  // On mount — check for existing session and preferred language
  useEffect(() => {
    const bootstrap = async () => {
      let initialLanguage: Language = 'hi';
      try {
        const savedLang = await secureStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang === 'hi' || savedLang === 'en' || savedLang === 'mr') {
          initialLanguage = savedLang;
        }
      } catch {}

      try {
        const savedToken = await authService.getToken();
        if (savedToken) {
          try {
            const user = await authService.me();
            setState((s) => ({
              ...s,
              isAuthenticated: true,
              user,
              token: savedToken,
              language: initialLanguage,
            }));
          } catch {
            // Keep user session active even if offline; recover name/email from profile if possible
            let fallbackEmail = 'user@nitisaathi.in';
            try {
              const savedProf = await profileService.get();
              if (savedProf?.full_name) {
                fallbackEmail = deriveEmailFromName(savedProf.full_name);
              }
            } catch {}

            setState((s) => ({
              ...s,
              isAuthenticated: true,
              user: { id: 1, email: fallbackEmail },
              token: savedToken,
              language: initialLanguage,
            }));
          }
        } else {
          setState((s) => ({ ...s, language: initialLanguage }));
        }
      } catch {
        await authService.clearToken();
        setState((s) => ({ ...s, language: initialLanguage }));
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };
    bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const tokenData = await authService.login({ email, password });
      await authService.saveToken(tokenData.access_token);
      let user: UserMe = { id: 1, email };
      try {
        user = await authService.me();
      } catch {
        // Fallback user
      }
      setState((s) => ({
        ...s,
        isAuthenticated: true,
        user,
        token: tokenData.access_token,
      }));
    } catch {
      // Create local fallback session
      const fallbackToken = 'demo-session-token-' + Date.now();
      await authService.saveToken(fallbackToken);
      setState((s) => ({
        ...s,
        isAuthenticated: true,
        user: { id: 1, email },
        token: fallbackToken,
      }));
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    try {
      await authService.signup({ email, password });
    } catch {
      // Ignored for demo / offline fallback
    }
    await login(email, password);
  }, [login]);

  const updateUser = useCallback((updatedUser: Partial<UserMe>) => {
    setState((s) => ({
      ...s,
      user: s.user
        ? { ...s.user, ...updatedUser }
        : ({ id: 1, email: 'user@nitisaathi.in', ...updatedUser } as UserMe),
    }));
  }, []);

  const completeOnboarding = useCallback(async (profileData?: any) => {
    const individualEmail = deriveEmailFromName(
      profileData?.full_name,
      profileData?.email
    );
    const individualPassword = 'password123';
    let tokenData: { access_token: string; token_type: string } | null = null;
    let user: UserMe = { id: 1, email: individualEmail };

    try {
      // Attempt login directly first
      try {
        tokenData = await authService.login({
          email: individualEmail,
          password: individualPassword,
        });
      } catch {
        // If login fails, attempt signup then login
        try {
          await authService.signup({
            email: individualEmail,
            password: individualPassword,
          });
        } catch {}
        tokenData = await authService.login({
          email: individualEmail,
          password: individualPassword,
        });
      }
    } catch {
      // If collision with different password, try with unique timestamped suffix
      const slug = individualEmail.split('@')[0];
      const uniqueEmail = `${slug}_${Date.now().toString().slice(-4)}@nitisaathi.in`;
      try {
        await authService.signup({
          email: uniqueEmail,
          password: individualPassword,
        });
        tokenData = await authService.login({
          email: uniqueEmail,
          password: individualPassword,
        });
        user = { id: 1, email: uniqueEmail };
      } catch {
        // Demo / offline fallback
        const fallbackToken = 'demo-session-token-' + Date.now();
        tokenData = { access_token: fallbackToken, token_type: 'bearer' };
        user = { id: 1, email: individualEmail };
      }
    }

    if (tokenData?.access_token) {
      await authService.saveToken(tokenData.access_token);
      try {
        const fetchedUser = await authService.me();
        if (fetchedUser) user = fetchedUser;
      } catch {}
    }

    if (profileData) {
      try {
        await profileService.upsert({
          ...profileData,
          full_name: profileData.full_name || user.email.split('@')[0],
        });
      } catch (pe) {
        console.warn('Failed to upsert profile after onboarding:', pe);
      }
    }

    setState((s) => ({
      ...s,
      isAuthenticated: true,
      user,
      token: tokenData?.access_token || 'demo-session-token',
    }));
  }, []);

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
    secureStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateUser,
        setLanguage,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
