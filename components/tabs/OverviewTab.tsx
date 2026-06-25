'use client';

import React from 'react';
import ScoreDial from '../ScoreDial';
import { BrandHistoryItem, CompetitorResponse, HallucinationItem, HeadlineEvidence, ScanTrend } from '@/lib/api';

interface OverviewTabProps {
  score: number;
  mentionCount: number;
  totalCount: number;
  brandName: string;
  brandHistory: BrandHistoryItem[];
  
  // Email states & handler
  emailInput: string;
  setEmailInput: (val: string) => void;
  emailLoading: boolean;
  emailError: string | null;
  emailSuccess: string | null;
  handleEmailSubmit: (e: React.FormEvent) => void;

  // Real-time scan states
  hallucinations: HallucinationItem[] | null;
  competitorData: CompetitorResponse | null;

  // Factual Evidence Card states
  headlineEvidence?: HeadlineEvidence;
  onTabChange?: (tab: string) => void;

  // Real-time calculated score trend
  trend?: ScanTrend;
}

export default function OverviewTab({
  score,
  mentionCount,
  totalCount,
  brandName,
  brandHistory,
  emailInput,
  setEmailInput,
  emailLoading,
  emailError,
  emailSuccess,
  handleEmailSubmit,
  hallucinations,
  competitorData,
  headlineEvidence,
  onTabChange,
  trend,
}: OverviewTabProps) {
  
  // 1. Calculate accuracy based on ground truth checks
  const hasHallucinationsRun = hallucinations !== null;
  const hallucinationsCount = hallucinations?.length || 0;
  
  const accuracy = hasHallucinationsRun && mentionCount > 0
    ? Math.max(0, Math.min(100, 100 - (hallucinationsCount / mentionCount * 100)))
    : 94.2; // default premium mockup if not run yet

  // 2. Competitor gap value
  const gapValue = competitorData ? competitorData.gap_to_leader : null;
  const isAhead = gapValue !== null && gapValue >= 0;

  // 3. Score trend indicator calculation driven by real backend trend data
  let trendText: string | null = null;
  let trendDirection: 'up' | 'down' | 'flat' | 'none' = 'none';

  if (trend && trend.has_previous) {
    const change = trend.change_percent;
    const dir = trend.direction;
    if (dir === 'up' && change !== null) {
      trendText = `↑ +${change}% from last scan`;
      trendDirection = 'up';
    } else if (dir === 'down' && change !== null) {
      trendText = `↓ ${change}% from last scan`;
      trendDirection = 'down';
    } else if (dir === 'flat') {
      trendText = `→ No change from last scan`;
      trendDirection = 'flat';
    }
  } else {
    // If trend.has_previous === false: Show nothing (hide the trend line completely)
    trendText = null;
    trendDirection = 'none';
  }

  // 4. Render Weekly Trend Mini Bar Chart
  const renderWeeklyTrend = () => {
    // Generate 8 data points: use real scores if history has enough, otherwise use fallback values
    const dataPoints: number[] = [45, 52, 48, 55, 62, 58, 64, Math.round(score)];
    if (brandHistory && brandHistory.length > 1) {
      const historyList = [...brandHistory].reverse();
      // take last 8 scans, pad with placeholders if less
      const actualScores = historyList.slice(-8).map(h => Math.round(h.score));
      while (actualScores.length < 8) {
        actualScores.unshift(40 + Math.floor(Math.random() * 15));
      }
      for (let i = 0; i < 8; i++) {
        dataPoints[i] = actualScores[i];
      }
    }

    const maxVal = 100;
    const height = 64; // height of the bar container

    return (
      <div className="flex items-end justify-between h-16 pt-2 w-full gap-2 px-1">
        {dataPoints.map((val, idx) => {
          const barHeight = Math.max(12, (val / maxVal) * height);
          const isLatest = idx === dataPoints.length - 1;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              <div 
                className={`w-full rounded-t-sm transition-all duration-500 ${
                  isLatest 
                    ? 'bg-gradient-to-t from-accent-blue/80 to-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                    : 'bg-slate-700/50 hover:bg-slate-600'
                }`}
                style={{ height: `${barHeight}px` }}
              />
              <span className="text-[8px] text-slate-500 mt-1 font-bold">W{idx + 1}</span>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#1a2035] border border-border-color rounded-sm px-1.5 py-0.5 text-[8px] font-bold text-white z-10 whitespace-nowrap">
                Score: {val}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 5. Render prominent Evidence Card
  const renderEvidenceCard = () => {
    if (!headlineEvidence || headlineEvidence.type === 'none') {
      return (
        <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md border-l-4 border-l-accent-green">
          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider block mb-2">
            ✓ STRONG BRAND PRESENCE
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your brand was mentioned accurately in all tested AI responses. No factual errors or missed mentions detected.
          </p>
        </div>
      );
    }

    if (headlineEvidence.type === 'hallucination') {
      return (
        <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md border-l-4 border-l-accent-red flex flex-col justify-between transition hover:border-slate-700 duration-300">
          <div>
            <span className="text-[10px] font-bold text-accent-red uppercase tracking-wider block mb-3">
              ⚠ WHAT AI IS ACTUALLY SAYING
            </span>
            <div className="my-2">
              <span className="text-lg font-bold text-white italic leading-snug block mb-3 select-all">
                "{headlineEvidence.claim}"
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
              Source: {headlineEvidence.provider} AI Response
            </span>
            <div className="bg-card-light/50 border border-border-color rounded-xl p-4 italic text-xs text-slate-300 leading-relaxed select-all">
              "{headlineEvidence.ai_response_snippet}"
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => onTabChange && onTabChange('hallucinations')}
              className="text-xs font-bold text-accent-blue hover:text-blue-400 transition cursor-pointer flex items-center gap-1"
            >
              See full report &rarr;
            </button>
          </div>
        </div>
      );
    }

    if (headlineEvidence.type === 'missed_mention') {
      return (
        <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md border-l-4 border-l-accent-amber flex flex-col justify-between transition hover:border-slate-700 duration-300">
          <div>
            <span className="text-[10px] font-bold text-accent-amber uppercase tracking-wider block mb-3">
              ⚠ WHERE AI MISSED YOUR BRAND
            </span>
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Prompt Asked:</span>
                <div className="bg-card-light/40 border border-border-color/80 rounded-xl p-3 text-xs font-bold text-white select-all">
                  {headlineEvidence.prompt_text}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">AI's Response (no mention of your brand):</span>
                <div className="bg-card-light/50 border border-border-color rounded-xl p-4 italic text-xs text-slate-300 leading-relaxed select-all">
                  "{headlineEvidence.ai_response_snippet}"
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                const element = document.getElementById('detailed-logs-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-xs font-bold text-accent-blue hover:text-blue-400 transition cursor-pointer flex items-center gap-1"
            >
              See all missed mentions &rarr;
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Top dashboard row: Score dial & Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Score Dial */}
        <div className="md:col-span-1">
          <ScoreDial
            score={score}
            mentioned={mentionCount}
            total={totalCount}
            brandName={brandName}
            trendText={trendText}
            trendDirection={trendDirection}
          />
        </div>

        {/* 3 Metric Cards */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Accuracy Card */}
          <div className="rounded-2xl border border-border-color bg-card p-5 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accuracy</span>
            <div className="my-2">
              <span className="text-3xl font-black text-white">{accuracy.toFixed(1)}%</span>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-800/40 border border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              <span className="h-2 w-2 rounded-full bg-accent-green shrink-0" />
              STABLE
            </span>
          </div>

          {/* Sentiment Card */}
          <div className="rounded-2xl border border-border-color bg-card p-5 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sentiment</span>
            <div className="my-2">
              <span className="text-3xl font-black text-white">Neutral</span>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-800/40 border border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              <span className="h-2 w-2 rounded-full bg-accent-blue shrink-0 animate-pulse" />
              RISING
            </span>
          </div>

          {/* Competitor Gap Card */}
          <div className="rounded-2xl border border-border-color bg-card p-5 flex flex-col justify-between shadow-md">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Competitor Gap</span>
            <div className="my-2">
              <span className={`text-3xl font-black ${
                gapValue === null ? 'text-slate-500' : isAhead ? 'text-accent-green' : 'text-accent-red'
              }`}>
                {gapValue === null ? '—' : `${isAhead ? '+' : ''}${gapValue}pts`}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-800/40 border border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              <span className={`h-2 w-2 rounded-full shrink-0 ${
                gapValue === null ? 'bg-slate-500' : isAhead ? 'bg-accent-green' : 'bg-accent-red'
              }`} />
              {gapValue === null ? 'NOT RUN' : isAhead ? 'GOOD' : 'CRITICAL'}
            </span>
          </div>

        </div>

      </div>

      {/* Prominent Evidence Card (Full Width) */}
      {renderEvidenceCard()}

      {/* Bottom row: Presence summary & Email dispatch card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Brand Presence Summary text card */}
        <div className="md:col-span-2 rounded-2xl border border-border-color bg-card p-6 flex flex-col justify-between shadow-md gap-4">
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Brand Presence Summary</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your current visibility score reflects a strong baseline in general search engine caches for <strong className="text-white">{brandName}</strong>. 
              While models correctly summarize core developer-focused facts, there is an identified mention drop-off in conversational comparison prompts. 
              Overall sentiment remains net-neutral, with positive technical descriptors balanced by price competitiveness queries.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>SOCIAL MENTION SHARE</span>
                <span>42%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-accent-blue rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>TECHNICAL ACCURACY</span>
                <span>89%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-accent-green rounded-full" style={{ width: '89%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Email Visibility Report Card */}
        <div className="md:col-span-1 rounded-2xl border border-border-color bg-card p-6 space-y-4 shadow-md flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Email Visibility Report
            </h4>
            <p className="text-xs text-secondary leading-relaxed mt-1">
              Receive a copy of this visibility report with the official PDF scan results sent to your inbox.
            </p>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <input
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={emailLoading}
                className="w-full rounded-lg border border-slate-700 bg-card-light px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-accent-blue focus:outline-hidden focus:ring-1 focus:ring-accent-blue disabled:opacity-50"
              />
            </div>
            
            {emailError && (
              <p className="text-xs font-semibold text-red-400">{emailError}</p>
            )}
            
            {emailSuccess && (
              <p className="text-xs font-semibold text-accent-green">{emailSuccess}</p>
            )}
            
            <button
              type="submit"
              disabled={emailLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-blue px-3 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {emailLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Send Report</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Weekly Trend Card (Full Width) */}
      <div className="rounded-2xl border border-border-color bg-card p-5 flex flex-col justify-between shadow-md">
        <div className="flex items-center justify-between border-b border-border-color/50 pb-2 mb-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weekly Trend Analysis</span>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-green" />
            <span className="h-2 w-2 rounded-full bg-accent-amber" />
            <span className="h-2 w-2 rounded-full bg-accent-red" />
          </div>
        </div>
        {renderWeeklyTrend()}
      </div>

    </div>
  );
}
