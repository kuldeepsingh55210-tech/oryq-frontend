'use client';

import React from 'react';

export type CardAccentColor = 'critical' | 'medium' | 'positive' | 'primary' | 'entity';
export type CardPadding = 'standard' | 'large' | 'none';

export interface PremiumCardProps {
  children?: React.ReactNode;
  interactive?: boolean;
  accentColor?: CardAccentColor;
  padding?: CardPadding;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function PremiumCard({
  children,
  interactive = false,
  accentColor,
  padding = 'standard',
  loading = false,
  error,
  onRetry,
  className = '',
  onClick,
}: PremiumCardProps) {
  // Padding variants
  let paddingClass = 'p-6';
  if (padding === 'large') paddingClass = 'p-6 md:p-8';
  if (padding === 'none') paddingClass = 'p-0';

  // Accent stripe left border variants
  let accentClass = '';
  if (accentColor === 'critical') accentClass = 'border-l-4 border-l-[#DC2626]';
  if (accentColor === 'medium') accentClass = 'border-l-4 border-l-[#D97706]';
  if (accentColor === 'positive') accentClass = 'border-l-4 border-l-[#0EA47A]';
  if (accentColor === 'primary') accentClass = 'border-l-4 border-l-[#1B4FD8]';
  if (accentColor === 'entity') accentClass = 'border-l-4 border-l-[#7C3AED]';

  // Hover elevation strictly for interactive cards
  const interactiveClass = interactive
    ? 'cursor-pointer hover:border-white/20 hover:bg-card-light hover:shadow-lg hover:shadow-blue-950/20 hover:-translate-y-0.5'
    : 'cursor-default';

  if (loading) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-border-color bg-card ${paddingClass} ${accentClass} ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-1/3 rounded-md bg-white/10" />
          <div className="h-8 w-2/3 rounded-lg bg-white/15" />
          <div className="h-3 w-1/2 rounded-md bg-white/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/10 ${paddingClass} ${className}`}
      >
        <div className="flex items-center justify-between gap-4 text-xs font-semibold text-red-300">
          <span>{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-lg bg-[#DC2626]/20 px-3 py-1.5 text-xs font-bold text-red-200 transition hover:bg-[#DC2626]/40 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`relative overflow-hidden rounded-2xl border border-border-color bg-card backdrop-blur-md transition-all duration-200 ${paddingClass} ${accentClass} ${interactiveClass} ${className}`}
    >
      {children}
    </div>
  );
}
