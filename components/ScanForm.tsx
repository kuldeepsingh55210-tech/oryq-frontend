'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startScan } from '@/lib/api';
import ScanningProgress from './ScanningProgress';

export default function ScanForm() {
  const router = useRouter();
  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple validations
    if (!brandName.trim()) {
      setError('Brand name is required');
      return;
    }
    if (!websiteUrl.trim()) {
      setError('Website URL is required');
      return;
    }
    if (!industry.trim()) {
      setError('Industry is required');
      return;
    }

    try {
      setIsLoading(true);
      const res = await startScan(brandName.trim(), websiteUrl.trim(), industry.trim());
      
      if (res && res.scan_job_id) {
        router.push(`/scan/${res.scan_job_id}`);
      } else {
        throw new Error('No scan job ID returned from server');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to start scan. Please verify the backend is running.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border-color p-2 shadow-2xl">
        <ScanningProgress brandName={brandName || 'Your Brand'} scanType="initial" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-border-color bg-card p-6 md:p-8 backdrop-blur-md shadow-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="brandName" className="block text-sm font-semibold text-secondary">
            Brand Name
          </label>
          <input
            id="brandName"
            type="text"
            required
            placeholder="e.g. Zepto"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            disabled={isLoading}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-accent-blue focus:outline-hidden focus:ring-2 focus:ring-accent-blue/20 transition duration-200 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-semibold text-secondary">
            Website URL
          </label>
          <input
            id="websiteUrl"
            type="url"
            required
            placeholder="https://zepto.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            disabled={isLoading}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-accent-blue focus:outline-hidden focus:ring-2 focus:ring-accent-blue/20 transition duration-200 disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-semibold text-secondary">
            Industry / Category
          </label>
          <input
            id="industry"
            type="text"
            required
            placeholder="e.g. quick commerce, project management software"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            disabled={isLoading}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-accent-blue focus:outline-hidden focus:ring-2 focus:ring-accent-blue/20 transition duration-200 disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-medium text-red-400">
            <div className="flex gap-2">
              <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-xl bg-accent-blue px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:bg-blue-500 active:scale-98 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed select-none"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Running AI Visibility Scan...</span>
            </div>
          ) : (
            <span>Run Free AI Visibility Scan</span>
          )}
        </button>
      </form>
    </div>
  );
}
