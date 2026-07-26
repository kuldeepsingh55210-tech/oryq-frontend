'use client';

// NOTE: We use a client-side ProtectedRoute wrapper component instead of Next.js server-side middleware.ts because auth tokens are currently stored in browser localStorage. Next.js Edge middleware cannot access browser localStorage server-side. Once the backend moves to httpOnly cookies, server-side middleware.ts can be used.

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth/AuthContext';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return <LoadingScreen message="Verifying authentication..." />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
