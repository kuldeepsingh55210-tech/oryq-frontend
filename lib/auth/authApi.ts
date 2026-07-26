import { API_BASE_URL } from '../config';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer';
  email_verified: boolean;
  created_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  message: string;
}

async function authFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = 'Authentication request failed.';
    try {
      const errorBody = await response.json();
      if (errorBody?.detail) {
        errorMessage = typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(errorBody.detail);
      }
    } catch {
      // Non-JSON response
    }

    if (response.status === 409 || errorMessage.includes('already exists')) {
      errorMessage = 'That email is already registered.';
    } else if (response.status === 401 && !errorMessage.includes('expired')) {
      errorMessage = 'Invalid email or password.';
    } else if (response.status === 400 && errorMessage === 'Authentication request failed.') {
      errorMessage = 'Invalid request payload provided.';
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  return authFetch<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      name: data.name,
    }),
  });
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  return authFetch<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser(refreshToken: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function refreshAuthToken(refreshToken: string): Promise<AuthTokens> {
  return authFetch<AuthTokens>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return authFetch<{ message: string }>('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function getCurrentUser(accessToken: string): Promise<User> {
  return authFetch<User>('/api/v1/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
