'use client';

import React from 'react';
import CompetitorChart from '../CompetitorChart';
import ScanningProgress from '../ScanningProgress';
import { CompetitorResponse } from '@/lib/api';

interface CompetitorTabProps {
  comp1: string;
  setComp1: (val: string) => void;
  comp2: string;
  setComp2: (val: string) => void;
  compLoading: boolean;
  compError: string | null;
  competitorData: CompetitorResponse | null;
  handleCompetitorSubmit: (e: React.FormEvent) => void;
  brandName: string;
  score: number;
}

export default function CompetitorTab({
  comp1,
  setComp1,
  comp2,
  setComp2,
  compLoading,
  compError,
  competitorData,
  handleCompetitorSubmit,
  brandName,
  score,
}: CompetitorTabProps) {
  return (
    <div className="space-y-6">
      
      {/* Competitor Input Card */}
      <div className="rounded-2xl border border-border-color bg-card p-6 md:p-8 shadow-lg">
        <div className="border-b border-border-color pb-4 mb-6">
          <h3 className="text-lg font-bold text-white">Compare Against Competitors</h3>
          <p className="text-xs text-secondary mt-1">
            Enter competitor brands to evaluate visibility scores and market rank.
          </p>
        </div>

        <form onSubmit={handleCompetitorSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="comp1" className="block text-xs font-semibold text-secondary">
                Competitor 1
              </label>
              <input
                id="comp1"
                type="text"
                placeholder="e.g. Blinkit"
                value={comp1}
                onChange={(e) => setComp1(e.target.value)}
                disabled={compLoading}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-card-light px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-blue focus:outline-hidden focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="comp2" className="block text-xs font-semibold text-secondary">
                Competitor 2
              </label>
              <input
                id="comp2"
                type="text"
                placeholder="e.g. Swiggy Instamart"
                value={comp2}
                onChange={(e) => setComp2(e.target.value)}
                disabled={compLoading}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-card-light px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-accent-blue focus:outline-hidden focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
              />
            </div>
          </div>

          {compError && (
            <p className="text-xs font-semibold text-red-400">{compError}</p>
          )}

          <button
            type="submit"
            disabled={compLoading}
            className="inline-flex items-center justify-center rounded-lg bg-accent-blue px-5 py-3 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {compLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Comparing...
              </span>
            ) : (
              'Compare Competitors'
            )}
          </button>
        </form>
      </div>

      {/* Competitor Loading State Override using ScanningProgress */}
      {compLoading && (
        <ScanningProgress brandName={brandName} scanType="competitor" />
      )}

      {/* Competitor Chart Display */}
      {!compLoading && competitorData && (
        <CompetitorChart
          mainBrand={{ name: brandName, score }}
          competitors={competitorData.competitors}
          rank={competitorData.rank}
          gapToLeader={competitorData.gap_to_leader}
        />
      )}

    </div>
  );
}
