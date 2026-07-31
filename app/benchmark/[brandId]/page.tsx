'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';
import PremiumCard from '@/components/ui/PremiumCard';
import MetricStat from '@/components/ui/MetricStat';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { formatScore, formatNumber } from '@/lib/utils/formatters';

interface PageProps {
  params: Promise<{ brandId: string }>;
}

interface BenchmarkResponse {
  brand_score: number;
  industry: string;
  percentile: number;
  message: string;
  industry_avg: number;
  industry_p75: number;
  industry_p90: number;
  peer_comparison: string;
}

interface IndustryBenchmarkResponse {
  industry: string;
  avg_visibility_score: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  brand_count: number;
  computed_at: string;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function BenchmarkPageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const brandId = resolvedParams.brandId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResponse | null>(null);
  const [industryStats, setIndustryStats] = useState<IndustryBenchmarkResponse | null>(null);

  const buildHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const benchmarkRes = await fetch(`${API_BASE_URL}/api/v1/benchmark/${brandId}`, {
        headers: buildHeaders(),
      });
      if (!benchmarkRes.ok) throw new Error('Failed to load benchmark summary.');
      const benchmarkData: BenchmarkResponse = await benchmarkRes.json();
      setBenchmark(benchmarkData);

      const industryRes = await fetch(
        `${API_BASE_URL}/api/v1/benchmark/industry/${encodeURIComponent(benchmarkData.industry)}`,
        { headers: buildHeaders() }
      );
      if (!industryRes.ok) throw new Error('Failed to load industry benchmark stats.');
      const industryData: IndustryBenchmarkResponse = await industryRes.json();
      setIndustryStats(industryData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading benchmark data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && brandId) {
      localStorage.setItem('lastBrandId', brandId);
    }
    fetchData();
  }, [brandId]);

  const positioned = useMemo(() => {
    if (!benchmark || !industryStats) return null;

    const score = benchmark.brand_score;
    const values = [0, industryStats.p25, industryStats.p50, industryStats.p75, industryStats.p90, 100];
    const range = values[values.length - 1] - values[0] || 1;
    const xFor = (value: number) => 20 + ((clamp(value, 0, 100) - values[0]) / range) * 560;

    const brandRank = clamp(benchmark.percentile, 0, 100);
    const topPercentage = Math.max(1, 100 - brandRank);
    const standingColor = score >= industryStats.p50 ? '#0EA47A' : '#94A3B8';

    return {
      score,
      brandRank,
      topPercentage,
      standingColor,
      xFor,
      baselineY: 108,
    };
  }, [benchmark, industryStats]);

  if (loading) {
    return <LoadingScreen message="Loading benchmark positioning..." />;
  }

  return (
    <SidebarLayout activeItem="benchmark">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        {/* Page Hero Header Banner */}
        <PremiumCard padding="large" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,164,122,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(27,79,216,0.14),transparent_32%)]" />
          <div className="relative flex flex-col gap-4 border-b border-border-color pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-blue">
                  Industry Benchmark Intelligence
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
                Benchmark Positioning
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-secondary">
                Compare your brand against the industry distribution with exact percentiles translated into actionable insight.
              </p>
            </div>
            {benchmark && industryStats && (
              <SeverityBadge
                severity={benchmark.brand_score >= industryStats.p50 ? 'positive' : 'medium'}
                label={benchmark.brand_score >= industryStats.p50 ? 'Above Median' : 'Below Median'}
              />
            )}
          </div>
        </PremiumCard>

        {/* Error State */}
        {error && (
          <PremiumCard error={error} onRetry={fetchData} />
        )}

        {/* Main Content Layout */}
        {benchmark && industryStats && positioned && (
          <div className="space-y-6">
            {/* 1. Primary "At-a-Glance" MetricStat Row (Deduplicated) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricStat
                label="Your Score"
                value={benchmark.brand_score}
                valueFormat="score"
                contextText={benchmark.peer_comparison}
                accentColor={benchmark.brand_score >= industryStats.p50 ? 'positive' : 'primary'}
              />

              <MetricStat
                label="Percentile Standing"
                value={benchmark.percentile}
                valueFormat="score"
                contextText={`Top ${formatNumber(positioned.topPercentage)}% in ${benchmark.industry}`}
                accentColor="primary"
              />

              <MetricStat
                label="Industry Median (P50)"
                value={industryStats.p50}
                valueFormat="score"
                contextText="50th percentile industry baseline"
              />

              <MetricStat
                label="Industry Average"
                value={industryStats.avg_visibility_score}
                valueFormat="score"
                contextText="Mean visibility score across cohort"
              />
            </div>

            {/* 2. Slim Single-Row Metadata Context Bar (Zero Box Grid Redundancy) */}
            <PremiumCard padding="standard">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-secondary">
                    Industry Sector: <strong className="text-white font-semibold">{benchmark.industry}</strong>
                  </span>
                  <span className="h-3 w-px bg-border-color hidden sm:inline-block" />
                  <span className="text-xs text-secondary">
                    Cohort Size: <strong className="text-white font-mono">{formatNumber(industryStats.brand_count)}</strong> companies
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {industryStats.brand_count < 5 && (
                    <SeverityBadge severity="medium" label="Limited Sample Size" />
                  )}
                  <span className="text-xs font-mono text-slate-400">
                    Updated: {formatDate(industryStats.computed_at)}
                  </span>
                </div>
              </div>

              {industryStats.brand_count < 5 && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-amber-300">
                  This benchmark is calculated from a smaller industry cohort ({formatNumber(industryStats.brand_count)} brands). Treat these percentiles as directional indicators rather than statistically definitive baselines.
                </div>
              )}
            </PremiumCard>

            {/* 3. Canonical Percentile Distribution Chart (Single Visualization) */}
            <PremiumCard padding="large">
              <div className="flex items-center justify-between border-b border-border-color pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Percentile Distribution Curve</h3>
                  <p className="mt-1 text-xs text-secondary">
                    P25, median (P50), P75, and P90 distribution markers plotted against your visibility score.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">0.0% to 100.0% Scale</span>
              </div>

              <div className="mt-6 rounded-xl border border-border-color/70 bg-slate-950/60 p-4">
                <svg viewBox="0 0 600 180" className="h-56 w-full">
                  <defs>
                    <linearGradient id="benchmarkFill" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0EA47A" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1B4FD8" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 20 150 C 90 36, 170 36, 240 150 S 390 264, 580 150"
                    fill="url(#benchmarkFill)"
                    opacity="0.7"
                  />
                  <line x1="20" y1="150" x2="580" y2="150" stroke="#334155" strokeWidth="1.2" />

                  {[industryStats.p25, industryStats.p50, industryStats.p75, industryStats.p90].map((marker) => {
                    const x = positioned.xFor(marker);
                    const label = marker === industryStats.p25 ? 'P25' : marker === industryStats.p50 ? 'P50' : marker === industryStats.p75 ? 'P75' : 'P90';
                    return (
                      <g key={marker}>
                        <line x1={x} y1="44" x2={x} y2="150" stroke="#64748B" strokeDasharray="4 4" strokeWidth="1.2" />
                        <circle cx={x} cy="150" r="5" fill="#94A3B8" />
                        <text x={x} y="36" textAnchor="middle" className="fill-slate-300 font-semibold" fontSize="11">
                          {label}
                        </text>
                        <text x={x} y="170" textAnchor="middle" className="fill-slate-500 font-mono" fontSize="10">
                          {formatScore(marker)}
                        </text>
                      </g>
                    );
                  })}

                  <g>
                    <line x1={positioned.xFor(positioned.score)} y1="24" x2={positioned.xFor(positioned.score)} y2="150" stroke={positioned.standingColor} strokeWidth="2.4" />
                    <circle cx={positioned.xFor(positioned.score)} cy="150" r="8" fill={positioned.standingColor} />
                    <text x={positioned.xFor(positioned.score)} y="18" textAnchor="middle" className="fill-white font-bold" fontSize="12">
                      You ({formatScore(positioned.score)})
                    </text>
                  </g>
                </svg>
              </div>
            </PremiumCard>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function BenchmarkPage(props: PageProps) {
  return (
    <ProtectedRoute>
      <BenchmarkPageContent {...props} />
    </ProtectedRoute>
  );
}
