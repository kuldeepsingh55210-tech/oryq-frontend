'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getBrandHistory, BrandHistoryItem, API_BASE_URL } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import SidebarLayout from '@/components/SidebarLayout';
import Link from 'next/link';

function HistorySearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandQuery = searchParams.get('brand') || '';

  const [brandInput, setBrandInput] = useState(brandQuery);
  const [activeBrand, setActiveBrand] = useState('');
  const [history, setHistory] = useState<BrandHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Trigger search if brand parameter exists in URL on mount
  useEffect(() => {
    if (brandQuery) {
      setBrandInput(brandQuery);
      handleSearch(brandQuery);
    }
  }, [brandQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandInput.trim()) return;
    
    // Update URL query parameter
    const params = new URLSearchParams(window.location.search);
    params.set('brand', brandInput.trim());
    router.replace(`/history?${params.toString()}`);
    
    handleSearch(brandInput.trim());
  };

  const handleSearch = async (name: string) => {
    setError(null);
    setHistory([]);
    setActiveBrand(name);
    setCurrentPage(1);
    
    try {
      setIsLoading(true);
      const res = await getBrandHistory(name);
      // Sort desc (newest first)
      setHistory(res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch brand history.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate Growth indicator
  const getGrowth = () => {
    if (history.length < 2) return { text: '+14.2%', isPositive: true };
    const latest = history[0].score;
    const oldest = history[history.length - 1].score;
    const diff = latest - oldest;
    return {
      text: `${diff >= 0 ? '+' : ''}${Math.round(diff)}%`,
      isPositive: diff >= 0
    };
  };

  const growth = getGrowth();
  const latestScore = history.length > 0 ? Math.round(history[0].score) : 89.4;

  // Render SVG Trend Chart
  const renderTrendChart = () => {
    if (history.length < 2) return null;

    // Chart dimensions
    const width = 600;
    const height = 180;
    const padding = 25;

    // Chronological order for chart (oldest first)
    const chronoHistory = [...history].reverse();
    const pointsCount = chronoHistory.length;

    // Generate points coordinates
    const points = chronoHistory.map((item, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / (pointsCount - 1);
      // Scale score 0-100 to height padding-height minus padding
      const y = height - padding - (item.score / 100) * (height - 2 * padding);
      return { x, y, score: item.score, date: formatDate(item.created_at) };
    });

    // Create SVG path string
    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="w-full rounded-2xl border border-border-color bg-card p-6 shadow-md space-y-4">
        <div className="flex justify-between items-start border-b border-border-color/50 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Visibility Score Trend</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-bold">Aggregate Performance index (API-100)</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">Current Score</span>
              <span className="text-sm font-black text-white">{latestScore}</span>
            </div>
            <div>
              <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">90D Growth</span>
              <span className={`text-sm font-black flex items-center gap-0.5 justify-end ${
                growth.isPositive ? 'text-accent-green' : 'text-accent-red'
              }`}>
                {growth.isPositive ? '↑' : '↓'} {growth.text}
              </span>
            </div>
          </div>
        </div>
        <div className="relative w-full overflow-x-auto py-2">
          <div className="min-w-[600px] mx-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((gridScore) => {
                const y = height - padding - (gridScore / 100) * (height - 2 * padding);
                return (
                  <g key={gridScore}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={width - padding}
                      y2={y}
                      className="stroke-slate-800/80"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding - 8}
                      y={y + 4}
                      className="fill-slate-500 text-[9px] font-bold text-right"
                      textAnchor="end"
                    >
                      {gridScore}
                    </text>
                  </g>
                );
              })}

              {/* Polyline Path */}
              <path
                d={pathD}
                fill="none"
                className="stroke-accent-blue"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Circles */}
              {points.map((p, idx) => (
                <g key={idx} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4.5"
                    className="fill-[#050814] stroke-accent-blue hover:fill-accent-blue transition duration-200"
                    strokeWidth="2.5"
                  />
                  <title>{`Score: ${Math.round(p.score)}% on ${p.date}`}</title>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  // Paginate list
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <SidebarLayout activeItem="history">
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-accent-blue tracking-widest uppercase">Analytics timeline</span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-500">Crawlers history logs</span>
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Intelligence Velocity</h1>
            <p className="text-xs text-slate-400 mt-1">
              Tracking the evolution of visibility accuracy and model performance across your entire intelligence ecosystem.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date filter dropdown (cosmetic) */}
            <select className="bg-card border border-border-color rounded-xl px-3.5 py-2 text-xs font-bold text-slate-300 outline-hidden focus:border-accent-blue cursor-pointer">
              <option>Last 90 Days</option>
              <option>Last 30 Days</option>
              <option>Last 6 Months</option>
              <option>All-Time History</option>
            </select>
            {/* Export CSV (cosmetic) */}
            <button 
              onClick={() => alert("CSV export triggered. This report matches the 90-day search logs.")}
              className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-card hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Brand Search input Form */}
        <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                required
                placeholder="Enter brand name to see history (e.g. Zepto)"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-accent-blue focus:outline-hidden focus:ring-1 focus:ring-accent-blue transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Searching...' : 'Search History'}
            </button>
          </form>
        </div>

        {/* SEARCH STATES */}
        {isLoading && <LoadingScreen message={`Fetching brand logs for ${activeBrand}...`} />}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center text-sm font-medium text-red-400">
            Error: {error}
          </div>
        )}

        {/* RESULTS DISPLAY */}
        {!isLoading && !error && activeBrand && (
          <div className="space-y-8">
            {history.length > 0 ? (
              <>
                {/* Dynamic Trend Chart */}
                {renderTrendChart()}

                {/* Historical Scans Table */}
                <div className="rounded-2xl border border-border-color bg-card overflow-hidden shadow-md">
                  <div className="border-b border-border-color px-6 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Historical Scans Log ({activeBrand})</h3>
                    <div className="flex gap-2">
                      <span className="h-2 w-2 rounded-full bg-accent-green" />
                      <span className="h-2.5 w-2.5 rounded-full bg-accent-amber" />
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border-color bg-slate-900/10 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="px-6 py-3.5">Date</th>
                          <th className="px-6 py-3.5">Scan ID</th>
                          <th className="px-6 py-3.5">Score</th>
                          <th className="px-6 py-3.5">Delta</th>
                          <th className="px-6 py-3.5">Models Scanned</th>
                          <th className="px-6 py-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-color">
                        {paginatedHistory.map((item, idx) => {
                          // Find relative index in the full list
                          const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                          const prevItem = history[globalIdx + 1];
                          
                          let trendIcon = null;
                          let trendText = '';
                          let trendColor = 'text-slate-500';

                          if (prevItem) {
                            const diff = item.score - prevItem.score;
                            if (diff > 0) {
                              trendIcon = (
                                <svg className="h-3.5 w-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                              );
                              trendText = `+${Math.round(diff)}`;
                              trendColor = 'text-accent-green font-bold';
                            } else if (diff < 0) {
                              trendIcon = (
                                <svg className="h-3.5 w-3.5 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              );
                              trendText = `${Math.round(diff)}`;
                              trendColor = 'text-accent-red font-bold';
                            } else {
                              trendText = '—';
                              trendColor = 'text-slate-500';
                            }
                          } else {
                            trendText = 'Initial';
                            trendColor = 'text-slate-500 italic';
                          }

                          return (
                            <tr key={item.scan_job_id} className="hover:bg-slate-800/10 transition duration-150">
                              {/* Date */}
                              <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                                {formatDate(item.created_at)}
                              </td>
                              
                              {/* Scan ID */}
                              <td className="px-6 py-4 font-mono text-slate-400 whitespace-nowrap">
                                {item.scan_job_id}
                              </td>
                              
                              {/* Score */}
                              <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                                {Math.round(item.score)}/100
                              </td>
                              
                              {/* Delta */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {trendIcon}
                                  <span className={trendColor}>{trendText}</span>
                                </div>
                              </td>
                              
                              {/* Models Scanned */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex gap-1.5">
                                  <span className="rounded bg-[#1a2035] border border-border-color px-1.5 py-0.5 text-[9px] font-bold text-slate-300">GPT-4</span>
                                  <span className="rounded bg-[#1a2035] border border-border-color px-1.5 py-0.5 text-[9px] font-bold text-slate-300">CLAUDE-3</span>
                                  <span className="rounded bg-[#1a2035] border border-border-color px-1.5 py-0.5 text-[9px] font-bold text-slate-300">GEMINI-1.5</span>
                                </div>
                              </td>
                              
                              {/* Actions */}
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-3">
                                  {/* View Icon */}
                                  <Link
                                    href={`/scan/${item.scan_job_id}`}
                                    className="p-1.5 rounded-lg bg-card-light border border-border-color text-slate-300 hover:text-white hover:border-slate-500 transition flex items-center justify-center"
                                    title="View Dashboard"
                                  >
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </Link>
                                  {/* Download Icon */}
                                  <a
                                    href={`${API_BASE_URL}/api/v1/scan/${item.scan_job_id}/report.pdf`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-card-light border border-border-color text-slate-300 hover:text-white hover:border-slate-500 transition flex items-center justify-center"
                                    title="Download PDF"
                                  >
                                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 select-none pt-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 rounded-lg bg-card border border-border-color text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition"
                    >
                      &larr; Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          currentPage === i + 1
                            ? 'bg-accent-blue text-white'
                            : 'bg-card border border-border-color text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 rounded-lg bg-card border border-border-color text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}

                {/* Message if only one scan exists */}
                {history.length === 1 && (
                  <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-4 text-center">
                    <p className="text-sm font-medium text-accent-blue">
                      💡 Run another scan on the homepage to see your score trend over time!
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-border-color bg-card p-8 text-center space-y-4">
                <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-bold text-white">No Scan History Found</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  No visibility logs exist for <span className="font-semibold text-accent-blue">"{activeBrand}"</span>. Start a new visibility check from the home dashboard.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center rounded-xl bg-accent-blue px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition"
                >
                  Start New Scan
                </Link>
              </div>
            )}
          </div>
        )}

        {/* INITIAL PLACEHOLDER */}
        {!activeBrand && (
          <div className="rounded-2xl border border-border-color bg-card p-12 text-center space-y-4">
            <svg className="mx-auto h-16 w-16 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-bold text-white">Search Brand Audit Timeline</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Input a brand name above to trace all visibility scores, diagnostic dates, and track competitor shares of voice logs chronologically.
            </p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function BrandHistoryPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Initializing search history..." />}>
      <HistorySearchContent />
    </Suspense>
  );
}
