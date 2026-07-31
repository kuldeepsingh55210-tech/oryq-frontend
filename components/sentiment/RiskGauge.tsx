'use client';

import React from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import SeverityBadge, { SeverityLevel } from '@/components/ui/SeverityBadge';

export interface RiskGaugeProps {
  riskLevel: string;
  className?: string;
}

export default function RiskGauge({ riskLevel, className = '' }: RiskGaugeProps) {
  const norm = (riskLevel || 'Low').toLowerCase();

  let severity: SeverityLevel = 'positive';
  let strokeColor = '#0EA47A';
  let dashOffset = '200';

  if (norm === 'high' || norm === 'critical') {
    severity = 'critical';
    strokeColor = '#DC2626';
    dashOffset = '0';
  } else if (norm === 'medium') {
    severity = 'medium';
    strokeColor = '#D97706';
    dashOffset = '125.6';
  }

  return (
    <PremiumCard className={`w-full ${className}`}>
      <div className="flex items-center justify-between border-b border-border-color pb-4 mb-2">
        <h3 className="text-sm font-bold text-white">Reputation Risk Gauge</h3>
        <SeverityBadge severity={severity} label={riskLevel} />
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        {/* Semi-Circle SVG Gauge */}
        <div className="relative h-28 w-56 flex items-end justify-center">
          <svg viewBox="0 0 200 110" className="h-full w-full overflow-visible">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#334155"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Gauge Value Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={strokeColor}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute bottom-2 flex flex-col items-center">
            <span className="text-2xl font-extrabold font-mono text-white">
              {riskLevel}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Risk Level
            </span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
}
