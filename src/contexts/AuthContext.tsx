import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { AuthUserInfo } from '@/types/api';

interface AuthContextValue {
  user: AuthUserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
  }, []);

  // Configura interceptor de 401
  useEffect(() => {
    api.onUnauthorized = logout;
    return () => {
      api.onUnauthorized = null;
    };
  }, [logout]);

  // Revalida sessão na inicialização
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.me()
      .then((userInfo) => {
        setUser(userInfo);
      })
      .catch(() => {
        api.setToken(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password });
    api.setToken(response.token);
    setUser(response.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
