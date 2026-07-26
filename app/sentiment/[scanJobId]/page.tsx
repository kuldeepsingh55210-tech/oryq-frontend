'use client';

import React, { useEffect, useState, use } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';

interface PageProps {
  params: Promise<{ scanJobId: string }>;
}

interface SentimentItem {
  id: string;
  scan_job_id: string;
  scan_result_id: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  classification_method: string;
  has_hallucination: boolean;
  hallucination_text?: string;
  risk_level?: string;
  created_at: string;
}

interface ReputationData {
  reputation_score: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  risk_level: string;
  narrative_summary: string;
}

function SentimentPageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const scanJobId = resolvedParams.scanJobId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentimentList, setSentimentList] = useState<SentimentItem[]>([]);
  const [reputation, setReputation] = useState<ReputationData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const sentRes = await fetch(`${API_BASE_URL}/api/v1/sentiment/${scanJobId}/feed`, { headers });
        if (!sentRes.ok) {
          throw new Error('Failed to fetch sentiment feed');
        }
        const sentData = await sentRes.json();
        setSentimentList(sentData || []);

        // Calculate reputation metrics
        const total = sentData.length || 1;
        const pos = sentData.filter((s: SentimentItem) => s.sentiment === 'positive').length;
        const neg = sentData.filter((s: SentimentItem) => s.sentiment === 'negative').length;
        const neu = total - pos - neg;

        const posPct = Math.round((pos / total) * 100);
        const negPct = Math.round((neg / total) * 100);
        const neuPct = 100 - posPct - negPct;

        setReputation({
          reputation_score: posPct,
          positive_pct: posPct,
          negative_pct: negPct,
          neutral_pct: neuPct,
          risk_level: negPct > 25 ? 'High' : negPct > 10 ? 'Medium' : 'Low',
          narrative_summary: `AI responses show a ${posPct}% positive sentiment alignment across evaluated prompt queries.`,
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error loading sentiment analysis.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [scanJobId]);

  if (loading) {
    return <LoadingScreen message="Analyzing sentiment & brand reputation alignment..." />;
  }

  return (
    <SidebarLayout activeItem="dashboard">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
        <div className="border-b border-border-color pb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-blue">V2 Sentiment Engine</span>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Brand Sentiment & Reputation Audit</h1>
          <p className="mt-1 text-xs text-secondary">
            Granular sentiment breakdown and reputation risk analysis across LLM model responses.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        {reputation && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reputation Score</span>
              <div className="mt-2 text-3xl font-extrabold text-accent-green">{reputation.reputation_score}/100</div>
            </div>
            <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Positive Alignment</span>
              <div className="mt-2 text-3xl font-extrabold text-blue-400">{reputation.positive_pct}%</div>
            </div>
            <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Negative Sentiment</span>
              <div className="mt-2 text-3xl font-extrabold text-red-400">{reputation.negative_pct}%</div>
            </div>
            <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Assessment</span>
              <div className="mt-2 text-3xl font-extrabold text-amber-400">{reputation.risk_level}</div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border-color bg-card overflow-hidden shadow-md">
          <div className="border-b border-border-color px-6 py-4">
            <h3 className="text-sm font-bold text-white">Analyzed Sentiment Feed</h3>
          </div>
          <div className="divide-y divide-border-color">
            {sentimentList.map((item) => (
              <div key={item.id} className="p-6 transition hover:bg-slate-900/40">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      item.sentiment === 'positive'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : item.sentiment === 'negative'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {item.sentiment}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Score: {item.sentiment_score?.toFixed(2)}
                  </span>
                </div>
                {item.has_hallucination && (
                  <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    <strong>Hallucination detected:</strong> {item.hallucination_text || 'Inaccurate claim in AI output'}
                  </div>
                )}
              </div>
            ))}
            {sentimentList.length === 0 && (
              <div className="p-8 text-center text-xs text-secondary">
                No sentiment feed items found for this scan job.
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function SentimentPage(props: PageProps) {
  return (
    <ProtectedRoute>
      <SentimentPageContent {...props} />
    </ProtectedRoute>
  );
}
