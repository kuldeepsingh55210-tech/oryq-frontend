'use client';

// NOTE: Storing JWT tokens in localStorage is a pragmatic choice for now since the backend returns tokens in JSON response bodies. In production, using httpOnly, secure cookies set directly by the backend is recommended to prevent XSS vulnerability risks.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  AuthTokens,
  loginUser,
  registerUser,
  logoutUser,
  refreshAuthToken,
  getCurrentUser,
  RegisterRequest,
} from './authApi';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: RegisterRequest) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  authenticatedFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
}

const ACCESS_TOKEN_KEY = 'oryq_access_token';
const REFRESH_TOKEN_KEY = 'oryq_refresh_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveSession = (tokens: AuthTokens, userData: User) => {
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  };

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }, []);

  // Refresh token mechanism
  const refreshTokens = useCallback(async (currentRefresh: string): Promise<string> => {
    try {
      const newTokens = await refreshAuthToken(currentRefresh);
      setAccessToken(newTokens.access_token);
      setRefreshToken(newTokens.refresh_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACCESS_TOKEN_KEY, newTokens.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, newTokens.refresh_token);
      }
      return newTokens.access_token;
    } catch (error) {
      clearSession();
      throw error;
    }
  }, [clearSession]);

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const storedAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedAccess) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser(storedAccess);
        setAccessToken(storedAccess);
        setRefreshToken(storedRefresh);
        setUser(userData);
      } catch {
        // Access token expired or invalid, try refresh token
        if (storedRefresh) {
          try {
            const newAccess = await refreshTokens(storedRefresh);
            const userData = await getCurrentUser(newAccess);
            setUser(userData);
          } catch {
            clearSession();
          }
        } else {
          clearSession();
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [clearSession, refreshTokens]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await loginUser(email, password);
    saveSession(
      {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        token_type: response.token_type,
      },
      response.user
    );
    return response.user;
  };

  const signup = async (data: RegisterRequest): Promise<{ message: string }> => {
    return registerUser(data);
  };

  const logout = async () => {
    const currentRefresh = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null);
    if (currentRefresh) {
      try {
        await logoutUser(currentRefresh);
      } catch {
        // Continue clearing session even if API call fails
      }
    }
    clearSession();
  };

  // Helper for authenticated requests with auto 401 retry & token refresh
  const authenticatedFetch = useCallback(
    async <T,>(url: string, options?: RequestInit): Promise<T> => {
      let tokenToUse = accessToken || (typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null);
      const currentRefresh = refreshToken || (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null);

      const headers = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
      };

      let response = await fetch(url, { ...options, headers });

      // If 401 Unauthorized, attempt refresh once
      if (response.status === 401 && currentRefresh) {
        try {
          tokenToUse = await refreshTokens(currentRefresh);
          const retryHeaders = {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
            Authorization: `Bearer ${tokenToUse}`,
          };
          response = await fetch(url, { ...options, headers: retryHeaders });
        } catch {
          clearSession();
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!response.ok) {
        let errMessage = 'Request failed.';
        try {
          const errBody = await response.json();
          errMessage = errBody?.detail || errMessage;
        } catch {
          // Non-JSON response
        }
        throw new Error(errMessage);
      }

      return response.json() as Promise<T>;
    },
    [accessToken, refreshToken, refreshTokens, clearSession]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        signup,
        logout,
        authenticatedFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
