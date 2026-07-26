'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import Navbar from '@/components/Navbar';

export default function SignupPage() {
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account.');
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
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-accent-blue border border-blue-500/20">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Check your email
              </h2>
              <p className="mt-3 text-sm text-secondary leading-relaxed">
                We sent a verification link to <strong className="text-white">{email}</strong>. Please click the link in your email to activate your account.
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
                  Create an ORYQ account
                </h1>
                <p className="mt-2 text-sm text-secondary">
                  Start tracking your AI share of voice across ChatGPT, Claude, and Gemini.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="mt-2 w-full rounded-xl border border-border-color bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="mt-2 w-full rounded-xl border border-border-color bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="mt-2 w-full rounded-xl border border-border-color bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-accent-blue focus:ring-1 focus:ring-accent-blue"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-accent-blue py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <div className="mt-8 border-t border-border-color pt-6 text-center text-sm text-secondary">
                Already have an account?{' '}
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
