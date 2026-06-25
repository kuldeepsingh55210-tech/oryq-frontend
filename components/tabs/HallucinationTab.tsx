'use client';

import React from 'react';
import HallucinationCard from '../HallucinationCard';
import ScanningProgress from '../ScanningProgress';
import { HallucinationItem } from '@/lib/api';

interface HallucinationTabProps {
  pricingFact: string;
  setPricingFact: (val: string) => void;
  foundedFact: string;
  setFoundedFact: (val: string) => void;
  categoryFact: string;
  setCategoryFact: (val: string) => void;
  halLoading: boolean;
  halError: string | null;
  hallucinations: HallucinationItem[] | null;
  handleHallucinationSubmit: (e: React.FormEvent) => void;
  brandName: string;
}

export default function HallucinationTab({
  pricingFact,
  setPricingFact,
  foundedFact,
  setFoundedFact,
  categoryFact,
  setCategoryFact,
  halLoading,
  halError,
  hallucinations,
  handleHallucinationSubmit,
  brandName,
}: HallucinationTabProps) {
  return (
    <div className="space-y-6">
      
      {/* Fact Audit Card */}
      <div className="rounded-2xl border border-border-color bg-card p-6 md:p-8 shadow-lg">
        <div className="border-b border-border-color pb-4 mb-6">
          <h3 className="text-lg font-bold text-white">Check for AI Hallucinations</h3>
          <p className="text-xs text-secondary mt-1">
            Fact-check AI statements against ground-truth information.
          </p>
        </div>

        <form onSubmit={handleHallucinationSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pricingFact" className="block text-xs font-semibold text-secondary">
                Pricing Ground-Truth
              </label>
              <input
                id="pricingFact"
                type="text"
                placeholder="e.g. Free delivery on orders above ₹99"
                value={pricingFact}
                onChange={(e) => setPricingFact(e.target.value)}
                disabled={halLoading}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-card-light px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-blue focus:outline-hidden focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="foundedFact" className="block text-xs font-semibold text-secondary">
                Founded Year
              </label>
              <input
                id="foundedFact"
                type="text"
                placeholder="e.g. Founded in 2021"
                value={foundedFact}
                onChange={(e) => setFoundedFact(e.target.value)}
                disabled={halLoading}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-card-light px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-blue focus:outline-hidden focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="categoryFact" className="block text-xs font-semibold text-secondary">
                Product Category
              </label>
              <input
                id="categoryFact"
                type="text"
                placeholder="e.g. Quick commerce / instant delivery"
                value={categoryFact}
                onChange={(e) => setCategoryFact(e.target.value)}
                disabled={halLoading}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-card-light px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-blue focus:outline-hidden focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
              />
            </div>
          </div>

          {halError && (
            <p className="text-xs font-semibold text-red-400">{halError}</p>
          )}

          <button
            type="submit"
            disabled={halLoading}
            className="inline-flex items-center justify-center rounded-lg bg-accent-blue px-5 py-3 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {halLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'Check for False Claims'
            )}
          </button>
        </form>
      </div>

      {/* Loading progress overlay */}
      {halLoading && (
        <ScanningProgress brandName={brandName} scanType="hallucination" />
      )}

      {/* Hallucinations results grid */}
      {!halLoading && hallucinations && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border-color/50 pb-2">
            <h4 className="text-sm font-bold text-white">Fact Audit Results</h4>
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-accent-red border border-accent-red/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-red shrink-0" />
              LIVE METRICS
            </span>
          </div>
          {hallucinations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {hallucinations.map((h, i) => (
                <HallucinationCard
                  key={i}
                  claim={h.claim}
                  sourceResponse={h.source_response}
                  provider={h.provider}
                  severity={h.severity}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-accent-green/30 bg-accent-green/10 p-6 text-center shadow-inner flex flex-col items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-accent-green">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="text-sm font-bold text-accent-green">
                No Hallucinations Detected
              </p>
              <p className="text-xs text-slate-400">
                All audited statements match LLM responses perfectly. Your brand information is indexed accurately.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
