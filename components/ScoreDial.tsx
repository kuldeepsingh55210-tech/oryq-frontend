'use client';

import { useEffect, useState } from 'react';

interface ScoreDialProps {
  score: number;
  mentioned: number;
  total: number;
  brandName: string;
  trendText?: string | null;
  trendDirection?: 'up' | 'down' | 'flat' | 'none';
}

export default function ScoreDial({
  score,
  mentioned,
  total,
  brandName,
  trendText,
  trendDirection = 'none'
}: ScoreDialProps) {
  const [offset, setOffset] = useState(502.65); // Circumference for r=80
  const radius = 80;
  const circumference = 2 * Math.PI * radius; // 502.65

  useEffect(() => {
    const timer = setTimeout(() => {
      const progressOffset = circumference - (score / 100) * circumference;
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  // Color mapping logic
  let ringColor = 'stroke-accent-red';
  let textColor = 'text-accent-red';
  let badgeBg = 'bg-accent-red/20 text-accent-red border-accent-red/30';
  let statusText = 'Low Visibility';
  let dotColor = 'bg-accent-red';

  if (score >= 70) {
    ringColor = 'stroke-accent-green';
    textColor = 'text-accent-green';
    badgeBg = 'bg-accent-green/20 text-accent-green border-accent-green/30';
    statusText = 'High Visibility';
    dotColor = 'bg-accent-green';
  } else if (score >= 40) {
    ringColor = 'stroke-accent-amber';
    textColor = 'text-accent-amber';
    badgeBg = 'bg-accent-amber/20 text-accent-amber border-accent-amber/30';
    statusText = 'Moderate Visibility';
    dotColor = 'bg-accent-amber';
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border-color bg-card p-6 text-center shadow-lg">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        Visibility Score
      </span>
      
      <div className="relative my-4 flex h-44 w-44 items-center justify-center">
        {/* Background track circle */}
        <svg className="absolute h-full w-full rotate-270 transform">
          <circle
            cx="88"
            cy="88"
            r={radius}
            className="stroke-border-color fill-transparent"
            strokeWidth="10"
          />
        </svg>

        {/* Animated indicator circle */}
        <svg className="absolute h-full w-full rotate-270 transform">
          <circle
            cx="88"
            cy="88"
            r={radius}
            className={`fill-transparent ${ringColor} transition-all duration-1000 ease-out`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        {/* Score content overlay */}
        <div className="flex flex-col items-center">
          <span className={`text-4xl font-black tracking-tight ${textColor}`}>
            {Math.round(score)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            out of 100
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeBg}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0`} />
          {statusText}
        </span>
        
        <p className="max-w-xs text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">{mentioned}</strong> out of{' '}
          <strong className="text-white">{total}</strong> AI responses mentioned{' '}
          <span className="text-accent-blue font-bold">{brandName}</span>.
        </p>

        {/* Trend Indicator */}
        {trendText && (
          <div className="flex items-center gap-1.5 mt-1 border-t border-border-color/50 pt-2 w-full justify-center">
            {trendDirection === 'up' && !trendText.includes('↑') && (
              <svg className="h-3.5 w-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
            {trendDirection === 'down' && !trendText.includes('↓') && (
              <svg className="h-3.5 w-3.5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className={`text-xs font-bold ${
              trendDirection === 'up' ? 'text-accent-green' : trendDirection === 'down' ? 'text-accent-red' : 'text-slate-400'
            }`}>
              {trendText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
