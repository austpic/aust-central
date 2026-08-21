import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { apiClient } from '../api/client';
import { clearSession, setAccessToken, setSessionExpiredHandler } from '../api/client';
import { ApiError } from '../api/errors';

/**
 * Real session state, replacing the previous `localStorage` boolean in
 * utils/auth.ts. Mirrors lib/data/services/auth_service.dart: register/login
 * adopt the session, `restoreSession` runs once on mount, and `signOut`
 * revokes it server-side.
 *
 * The refresh token lives in the server's httpOnly cookie and is never
 * visible here — see api/client.ts. On mount there is no access token yet
 * (it is not persisted across reloads by design), so restoration means one
 * refresh call to trade the cookie for a fresh access token, then `/me` to
 * load the user it belongs to.
 */

export interface AppUser {
  id: string;
  email: string;
  name: string;
  studentId: string | null;
  department: string | null;
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  emailVerified: boolean;
  avatarFileId: string | null;
}

interface SessionResponse {
  user: AppUser;
  accessToken: string;
  expiresIn: number;
}

interface AuthContextValue {
  user: AppUser | null;
  isRestoring: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
  }) => Promise<AppUser>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<AppUser>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const adoptSession = useCallback((session: SessionResponse) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    return session.user;
  }, []);

  useEffect(() => {
    // Session expiry can be reported asynchronously by the interceptor (a
    // background request's refresh failed) — clear local state either way.
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshed = await apiClient
          .post<SessionResponse>('/auth/refresh')
          .catch(() => null);
        if (!refreshed) throw new Error('no session');
        setAccessToken(refreshed.accessToken);
        const me = await apiClient.get<AppUser>('/me');
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await apiClient.post<SessionResponse>('/auth/login', { email, password });
      return adoptSession(session);
    },
    [adoptSession],
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      studentId?: string;
      department?: string;
    }) => {
      const session = await apiClient.post<SessionResponse>('/auth/register', input);
      return adoptSession(session);
    },
    [adoptSession],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  }, []);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    await apiClient.post('/auth/verify-email', { email, otp });
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    await apiClient.post('/auth/resend-verification', { email });
  }, []);

  const resetPassword = useCallback(
    async (email: string, otp: string, newPassword: string) => {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    const me = await apiClient.get<AppUser>('/me');
    setUser(me);
    return me;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      isSignedIn: user !== null,
      login,
      register,
      signOut,
      forgotPassword,
      verifyEmail,
      resendVerification,
      resetPassword,
      refreshProfile,
    }),
    [user, isRestoring, login, register, signOut, forgotPassword, verifyEmail, resendVerification, resetPassword, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/** Same shape ApiException surfaced in the Flutter app — a message to show. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Something went wrong. Please try again.';
}
