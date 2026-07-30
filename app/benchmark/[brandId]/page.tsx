'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';

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

function formatScore(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
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
    const standingColor =
      score >= industryStats.p50 ? '#0EA47A' : '#94A3B8';

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
    <SidebarLayout activeItem="dashboard">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
        <div className="relative overflow-hidden rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,164,122,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(27,79,216,0.14),transparent_32%)]" />
          <div className="relative flex flex-col gap-4 border-b border-border-color pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-blue">V2 Benchmark</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
                Benchmark Positioning
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-secondary">
                Compare your brand against the industry distribution with the exact percentile translated into plain language.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {benchmark && industryStats && positioned && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 rounded-2xl border border-border-color bg-card p-6 shadow-md">
                <div className="flex items-start justify-between gap-4 border-b border-border-color pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white">Standing</h2>
                    <p className="mt-1 text-xs text-secondary">{benchmark.message}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                      benchmark.brand_score >= industryStats.p50
                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                        : 'border-slate-500/20 bg-slate-500/10 text-slate-300'
                    }`}
                  >
                    {benchmark.brand_score >= industryStats.p50 ? 'Pulse green' : 'Below median'}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Your Score</span>
                    <div className="mt-2 text-4xl font-extrabold text-white font-mono">{formatScore(benchmark.brand_score)}</div>
                    <p className="mt-2 text-xs text-slate-300">
                      {benchmark.peer_comparison}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border-color/70 bg-slate-950/50 p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Percentile</span>
                    <div className="mt-2 text-4xl font-extrabold text-white font-mono">Top {positioned.topPercentage}%</div>
                    <p className="mt-2 text-xs text-slate-400">
                      Based on the latest brand-to-industry comparison.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-border-color bg-card p-6 shadow-md">
                <div className="flex items-center justify-between border-b border-border-color pb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white">Benchmark Meta</h2>
                    <p className="mt-1 text-xs text-secondary">
                      Based on {industryStats.brand_count} companies in {benchmark.industry}.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Benchmark last updated: {formatDate(industryStats.computed_at)}
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs text-secondary">
                  <div className="flex items-center justify-between border-b border-border-color/60 pb-2">
                    <span>Industry average</span>
                    <span className="font-mono text-white">{formatScore(industryStats.avg_visibility_score)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border-color/60 pb-2">
                    <span>Industry median</span>
                    <span className="font-mono text-white">{formatScore(industryStats.p50)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border-color/60 pb-2">
                    <span>Industry P75</span>
                    <span className="font-mono text-white">{formatScore(industryStats.p75)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Industry P90</span>
                    <span className="font-mono text-white">{formatScore(industryStats.p90)}</span>
                  </div>
                </div>

                {industryStats.brand_count < 5 && (
                  <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">
                    This benchmark is based on a very small sample, so treat the percentile as directional rather than statistically strong.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-border-color pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Distribution View</h3>
                  <p className="mt-1 text-xs text-secondary">
                    P25, median, P75, and P90 markers plotted against your score.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">0% to 100%</span>
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
                    return (
                      <g key={marker}>
                        <line x1={x} y1="44" x2={x} y2="150" stroke="#64748B" strokeDasharray="4 4" strokeWidth="1.2" />
                        <circle cx={x} cy="150" r="5" fill="#94A3B8" />
                        <text x={x} y="36" textAnchor="middle" className="fill-slate-300" fontSize="11" fontWeight="600">
                          {marker === industryStats.p25 ? 'P25' : marker === industryStats.p50 ? 'P50' : marker === industryStats.p75 ? 'P75' : 'P90'}
                        </text>
                        <text x={x} y="170" textAnchor="middle" className="fill-slate-500" fontSize="10">
                          {formatScore(marker)}
                        </text>
                      </g>
                    );
                  })}

                  <g>
                    <line x1={positioned.xFor(positioned.score)} y1="24" x2={positioned.xFor(positioned.score)} y2="150" stroke={positioned.standingColor} strokeWidth="2.4" />
                    <circle cx={positioned.xFor(positioned.score)} cy="150" r="8" fill={positioned.standingColor} />
                    <text x={positioned.xFor(positioned.score)} y="18" textAnchor="middle" className="fill-white" fontSize="12" fontWeight="700">
                      You
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-border-color pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Comparison Table</h3>
                  <p className="mt-1 text-xs text-secondary">Your score versus the industry distribution markers.</p>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-border-color/70">
                <div className="grid grid-cols-2 md:grid-cols-5">
                  {[
                    ['Your Score', benchmark.brand_score, benchmark.brand_score >= industryStats.p50],
                    ['Industry P25', industryStats.p25, false],
                    ['Industry Median', industryStats.p50, false],
                    ['Industry P75', industryStats.p75, false],
                    ['Industry P90', industryStats.p90, false],
                  ].map(([label, value, isPrimary]) => (
                    <div
                      key={String(label)}
                      className={`border-r border-b border-border-color/70 bg-slate-950/40 p-4 last:border-r-0 md:border-b-0 ${
                        isPrimary ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label as string}</div>
                      <div className={`mt-2 text-2xl font-extrabold font-mono ${isPrimary ? 'text-green-400' : 'text-white'}`}>
                        {formatScore(value as number)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
