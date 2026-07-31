'use client';

import React from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { formatNumber, formatPercent } from '@/lib/utils/formatters';

export interface SentimentDonutProps {
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  totalPrompts: number;
  className?: string;
}

export default function SentimentDonut({
  positivePct,
  neutralPct,
  negativePct,
  totalPrompts,
  className = '',
}: SentimentDonutProps) {
  // SVG Donut Circle parameters
  const radius = 65;
  const circumference = 2 * Math.PI * radius; // ~408.4

  const posOffset = 0;
  const posStroke = (positivePct / 100) * circumference;

  const neuOffset = -posStroke;
  const neuStroke = (neutralPct / 100) * circumference;

  const negOffset = -(posStroke + neuStroke);
  const negStroke = (negativePct / 100) * circumference;

  return (
    <PremiumCard className={`w-full ${className}`}>
      <div className="flex items-center justify-between border-b border-border-color pb-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Sentiment Distribution</h3>
          <p className="mt-0.5 text-xs text-slate-400">Proportional breakdown of LLM query sentiment</p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {formatNumber(totalPrompts)} prompts
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* SVG Donut Chart */}
        <div className="relative h-44 w-44 flex items-center justify-center shrink-0">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-slate-900 fill-transparent"
              strokeWidth="16"
            />
            {/* Positive Segment */}
            {positivePct > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#0EA47A"
                strokeWidth="16"
                strokeDasharray={`${posStroke} ${circumference - posStroke}`}
                strokeDashoffset={posOffset}
                className="transition-all duration-700 ease-out"
              />
            )}
            {/* Neutral Segment */}
            {neutralPct > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#64748B"
                strokeWidth="16"
                strokeDasharray={`${neuStroke} ${circumference - neuStroke}`}
                strokeDashoffset={neuOffset}
                className="transition-all duration-700 ease-out"
              />
            )}
            {/* Negative Segment */}
            {negativePct > 0 && (
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#DC2626"
                strokeWidth="16"
                strokeDasharray={`${negStroke} ${circumference - negStroke}`}
                strokeDashoffset={negOffset}
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Center Text overlay */}
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-2xl font-extrabold font-mono text-white">
              {formatPercent(positivePct, false)}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Positive
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="space-y-3 w-full sm:w-auto">
          <div className="flex items-center justify-between gap-6 border-b border-border-color/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#0EA47A] shadow-sm" />
              <span className="text-xs font-semibold text-slate-300">Positive Alignment</span>
            </div>
            <span className="text-xs font-bold font-mono text-white">{formatPercent(positivePct, false)}</span>
          </div>

          <div className="flex items-center justify-between gap-6 border-b border-border-color/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#64748B] shadow-sm" />
              <span className="text-xs font-semibold text-slate-300">Neutral Sentiment</span>
            </div>
            <span className="text-xs font-bold font-mono text-white">{formatPercent(neutralPct, false)}</span>
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#DC2626] shadow-sm" />
              <span className="text-xs font-semibold text-slate-300">Negative Sentiment</span>
            </div>
            <span className="text-xs font-bold font-mono text-white">{formatPercent(negativePct, false)}</span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}
