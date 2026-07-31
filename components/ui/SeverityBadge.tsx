'use client';

import React from 'react';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'positive';

export interface SeverityBadgeProps {
  severity: SeverityLevel;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export default function SeverityBadge({
  severity,
  label,
  pulse,
  className = '',
}: SeverityBadgeProps) {
  const norm = severity.toLowerCase() as SeverityLevel;
  const isHighRisk = norm === 'critical' || norm === 'high';
  const shouldPulse = pulse ?? isHighRisk;

  const displayLabel = label || norm.toUpperCase();

  let colorStyles = '';
  let dotColor = '';

  switch (norm) {
    case 'critical':
    case 'high':
      colorStyles = 'border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]';
      dotColor = 'bg-[#DC2626]';
      break;
    case 'medium':
      colorStyles = 'border-[#D97706]/30 bg-[#D97706]/10 text-[#D97706]';
      dotColor = 'bg-[#D97706]';
      break;
    case 'positive':
      colorStyles = 'border-[#0EA47A]/30 bg-[#0EA47A]/10 text-[#0EA47A]';
      dotColor = 'bg-[#0EA47A]';
      break;
    case 'low':
    case 'info':
    default:
      colorStyles = 'border-slate-500/20 bg-slate-500/10 text-slate-300';
      dotColor = 'bg-slate-400';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colorStyles} ${className}`}
    >
      {shouldPulse && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor} animate-pulse`} />
      )}
      {displayLabel}
    </span>
  );
}
