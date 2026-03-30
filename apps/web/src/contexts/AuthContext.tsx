'use client';

import { type AuthUser } from '@shared-types';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  authService,
  type LoginPayload,
  type RegisterProfessionalPayload,
  type RegisterUserPayload,
  clearAccessToken,
} from '@/src/services/auth.service';
import { getUserFriendlyErrorMessage } from '@/src/lib/error-message';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (payload: LoginPayload) => Promise<AuthUser | null>;
  registerUser: (payload: RegisterUserPayload) => Promise<AuthUser | null>;
  registerProfessional: (payload: RegisterProfessionalPayload) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown): string => getUserFriendlyErrorMessage(error);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setError(null);
    try {
      const auth = await authService.login(payload);
      setUser(auth.user);
      return auth.user;
    } catch (e) {
      setError(getErrorMessage(e));
      return null;
    }
  }, []);

  const registerUser = useCallback(async (payload: RegisterUserPayload) => {
    setError(null);
    try {
      const auth = await authService.registerUser(payload);
      setUser(auth.user);
      return auth.user;
    } catch (e) {
      setError(getErrorMessage(e));
      return null;
    }
  }, []);

  const registerProfessional = useCallback(async (payload: RegisterProfessionalPayload) => {
    setError(null);
    try {
      const auth = await authService.registerProfessional(payload);
      setUser(auth.user);
      return auth.user;
    } catch (e) {
      setError(getErrorMessage(e));
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        const me = await authService.getMe();
        setUser(me);
      } catch {
        try {
          const auth = await authService.refresh();
          setUser(auth.user);
        } catch {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      clearError,
      login,
      registerUser,
      registerProfessional,
      logout,
    }),
    [clearError, error, isLoading, login, logout, registerProfessional, registerUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
