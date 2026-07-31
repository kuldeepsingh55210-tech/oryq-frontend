'use client';

import React from 'react';
import PremiumCard from './PremiumCard';
import { formatScore, formatNumber } from '@/lib/utils/formatters';

export interface ComparisonEntity {
  name: string;
  isPrimary?: boolean;
  values: number[];
}

export interface ComparisonBarChartProps {
  entities: ComparisonEntity[];
  dimensions: string[];
  maxValue?: number;
  valueFormat?: 'score' | 'number' | 'percent';
  title?: string;
  subtitle?: string;
  className?: string;
}

// Fixed color palette for non-primary comparison entities per spec
const NON_PRIMARY_PALETTE = ['#64748B', '#6366F1', '#0D9488', '#D97706'];
const PRIMARY_COLOR = '#1B4FD8';

export default function ComparisonBarChart({
  entities,
  dimensions,
  maxValue: explicitMax,
  valueFormat = 'score',
  title = 'Competitive Benchmark Analysis',
  subtitle = 'Multi-dimensional comparative performance vs rivals',
  className = '',
}: ComparisonBarChartProps) {
  if (!entities || entities.length === 0 || !dimensions || dimensions.length === 0) {
    return null;
  }

  // Assign colors to entities
  let nonPrimaryIdx = 0;
  const assignedEntities = entities.slice(0, 5).map((e) => {
    if (e.isPrimary) {
      return { ...e, color: PRIMARY_COLOR };
    }
    const color = NON_PRIMARY_PALETTE[nonPrimaryIdx % NON_PRIMARY_PALETTE.length];
    nonPrimaryIdx++;
    return { ...e, color };
  });

  // Calculate chart max value across all data points if not explicitly provided
  const allValues = assignedEntities.flatMap((e) => e.values);
  const calculatedMax = Math.max(...allValues, 100);
  const chartMax = explicitMax || calculatedMax;

  // Format metric value helper
  const renderValue = (val: number) => {
    if (valueFormat === 'number') {
      return formatNumber(val);
    }
    return formatScore(val);
  };

  return (
    <PremiumCard className={`w-full ${className}`}>
      {/* Title & Subtitle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* MANDATORY ACCESSIBILITY LEGEND */}
      <div className="flex items-center gap-4 flex-wrap pb-6 border-b border-border-color/50 mb-6">
        {assignedEntities.map((e) => (
          <div key={e.name} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shadow-sm shrink-0"
              style={{ backgroundColor: e.color }}
            />
            <span className="text-xs font-semibold text-slate-200">
              {e.name}
              {e.isPrimary && (
                <span className="ml-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  (Your Brand)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Dimension Comparison Rows */}
      <div className="space-y-6">
        {dimensions.map((dimLabel, dimIdx) => (
          <div key={dimLabel} className="space-y-2">
            {/* Dimension Title */}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              {dimLabel}
            </span>

            {/* Grouped Entity Horizontal Bars */}
            <div className="space-y-2 pl-2">
              {assignedEntities.map((entity) => {
                const rawVal = entity.values[dimIdx] ?? 0;
                const widthPct = Math.min(100, Math.max(2, (rawVal / chartMax) * 100));

                return (
                  <div key={`${entity.name}-${dimLabel}`} className="flex items-center gap-3">
                    {/* Entity Name Label */}
                    <span className="w-28 text-xs font-medium text-slate-300 truncate text-right shrink-0">
                      {entity.name}
                    </span>

                    {/* Bar Track */}
                    <div className="flex-1 h-5 bg-slate-900/80 rounded-md border border-border-color/40 overflow-hidden relative">
                      <div
                        className={`h-full rounded-r-sm transition-all duration-700 ease-out ${
                          entity.isPrimary ? 'shadow-[0_0_12px_rgba(27,79,216,0.6)]' : ''
                        }`}
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: entity.color,
                        }}
                      />
                    </div>

                    {/* Numeric Score Badge */}
                    <span className="w-16 text-right font-mono text-xs font-bold text-white shrink-0">
                      {renderValue(rawVal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}
