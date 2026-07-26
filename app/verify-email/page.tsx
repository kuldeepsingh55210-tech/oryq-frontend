'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/lib/auth/authApi';
import Navbar from '@/components/Navbar';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Verification token is missing from the link.');
      return;
    }

    async function executeVerification() {
      try {
        await verifyEmail(token as string);
        setStatus('success');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (err: unknown) {
        setStatus('error');
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Invalid or expired verification link.');
        }
      }
    }

    executeVerification();
  }, [token, router]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-border-color bg-card p-8 text-center shadow-2xl backdrop-blur-xl">
      {status === 'verifying' && (
        <div>
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-accent-blue border-t-transparent"></div>
          <h2 className="text-2xl font-bold text-white">Verifying email address...</h2>
          <p className="mt-2 text-sm text-secondary">
            Validating your verification token with the server.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Email verified</h2>
          <p className="mt-2 text-sm text-secondary">
            Your email address was successfully verified. Redirecting you to the log in page...
          </p>
          <div className="mt-6">
            <Link href="/login" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              Click here if not redirected automatically
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Verification failed</h2>
          <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
          <div className="mt-8 border-t border-border-color pt-6">
            <Link
              href="/login"
              className="inline-flex w-full justify-center rounded-xl bg-accent-blue py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600"
            >
              Go to Log in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#000008]">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
