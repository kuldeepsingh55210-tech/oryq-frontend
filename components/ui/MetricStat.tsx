'use client';

import React from 'react';
import PremiumCard, { CardAccentColor } from './PremiumCard';
import {
  formatScore,
  formatCurrency,
  formatPercent,
  formatNumber,
} from '@/lib/utils/formatters';

export interface MetricStatProps {
  label: string;
  value: number;
  deltaValue?: number;
  contextText?: string;
  trendData?: number[];
  goodDirection?: 'up' | 'down';
  colorBySentiment?: boolean;
  valueFormat?: 'score' | 'currency' | 'number' | 'percent';
  currency?: 'INR' | 'USD';
  interactive?: boolean;
  accentColor?: CardAccentColor;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function MetricStat({
  label,
  value,
  deltaValue,
  contextText,
  trendData,
  goodDirection = 'up',
  colorBySentiment = false,
  valueFormat = 'number',
  currency = 'INR',
  interactive = false,
  accentColor,
  loading = false,
  error,
  onRetry,
  onClick,
  className = '',
}: MetricStatProps) {
  // Format primary display value using lib/utils/formatters.ts
  let formattedValue = '';
  switch (valueFormat) {
    case 'score':
      formattedValue = formatScore(value);
      break;
    case 'currency':
      formattedValue = formatCurrency(value, currency);
      break;
    case 'percent':
      formattedValue = formatPercent(value, false);
      break;
    case 'number':
    default:
      formattedValue = formatNumber(value);
      break;
  }

  // Format delta value & styling using Phase 1a formatters logic + goodDirection
  let deltaBadge = null;
  if (deltaValue !== undefined && deltaValue !== null) {
    const formattedDelta = formatPercent(deltaValue, true);
    let deltaColors = 'border-slate-500/20 bg-slate-500/10 text-slate-400';

    if (deltaValue !== 0) {
      const isPositiveChange = deltaValue > 0;
      const isGoodChange = goodDirection === 'up' ? isPositiveChange : !isPositiveChange;
      deltaColors = isGoodChange
        ? 'border-[#0EA47A]/30 bg-[#0EA47A]/10 text-[#0EA47A]'
        : 'border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]';
    }

    deltaBadge = (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono ${deltaColors}`}
      >
        {formattedDelta}
      </span>
    );
  }

  // Sparkline rendering rule: ONLY if trendData is provided with >= 2 points
  const hasSparkline = Array.isArray(trendData) && trendData.length >= 2;

  const renderSparkline = () => {
    if (!hasSparkline || !trendData) return null;

    const min = Math.min(...trendData);
    const max = Math.max(...trendData);
    const range = max - min || 1;
    const width = 60;
    const height = 20;
    const padding = 2;

    const points = trendData
      .map((val, idx) => {
        const x = (idx / (trendData.length - 1)) * width;
        const y = height - padding - ((val - min) / range) * (height - padding * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const lastVal = trendData[trendData.length - 1];
    const firstVal = trendData[0];

    // Determine stroke color: neutral slate by default to prevent alert fatigue;
    // directional red/green ONLY when colorBySentiment is explicitly true.
    let strokeColor = '#94A3B8';
    if (colorBySentiment) {
      const isUp = lastVal >= firstVal;
      const isGood = goodDirection === 'up' ? isUp : !isUp;
      strokeColor = isGood ? '#0EA47A' : '#DC2626';
    }

    return (
      <svg
        className="w-[60px] h-[20px] overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
      >
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <PremiumCard
      interactive={interactive}
      accentColor={accentColor}
      loading={loading}
      error={error}
      onRetry={onRetry}
      onClick={onClick}
      className={className}
    >
      <div className="flex flex-col justify-between h-full space-y-3">
        {/* Top Header Row: Label + Optional Sparkline */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {label}
          </span>
          {hasSparkline && renderSparkline()}
        </div>

        {/* Value + Delta Row */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl md:text-4xl font-extrabold font-mono text-white tracking-tight">
            {formattedValue}
          </span>
          {deltaBadge}
        </div>

        {/* Context Subtext */}
        {contextText && (
          <p className="text-[11px] font-normal text-slate-400 leading-snug">
            {contextText}
          </p>
        )}
      </div>
    </PremiumCard>
  );
}
