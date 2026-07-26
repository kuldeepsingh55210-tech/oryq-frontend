'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/auth/authApi';
import Navbar from '@/components/Navbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send reset email.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#000008]">
      <Navbar />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md rounded-2xl border border-border-color bg-card p-8 shadow-2xl backdrop-blur-xl">
          {isSubmitted ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-accent-blue border border-blue-500/20">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Check your inbox
              </h2>
              <p className="mt-3 text-sm text-secondary leading-relaxed">
                If that email exists in our system, we sent a password reset link to your inbox.
              </p>
              <div className="mt-8 border-t border-border-color pt-6">
                <Link
                  href="/login"
                  className="inline-flex w-full justify-center rounded-xl bg-accent-blue py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600"
                >
                  Return to Log in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Reset your password
                </h1>
                <p className="mt-2 text-sm text-secondary">
                  Enter your registered email address and we will send you instructions to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="mt-2 w-full rounded-xl border border-border-color bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-accent-blue py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending instructions...' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-8 border-t border-border-color pt-6 text-center text-sm text-secondary">
                Remember your password?{' '}
                <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300">
                  Log in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
