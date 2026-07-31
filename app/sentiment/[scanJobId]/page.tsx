'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';
import PremiumCard from '@/components/ui/PremiumCard';
import MetricStat from '@/components/ui/MetricStat';
import SeverityBadge, { SeverityLevel } from '@/components/ui/SeverityBadge';
import SentimentDonut from '@/components/sentiment/SentimentDonut';
import RiskGauge from '@/components/sentiment/RiskGauge';
import { formatScore, formatNumber } from '@/lib/utils/formatters';

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
    if (typeof window !== 'undefined' && scanJobId) {
      localStorage.setItem('lastScanJobId', scanJobId);
    }

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
          narrative_summary: `AI responses show a ${posPct}% positive sentiment alignment across ${total} evaluated prompt queries.`,
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

  // Calculate count of detected hallucinations for 4th KPI card
  const hallucinationCount = useMemo(() => {
    return sentimentList.filter((s) => s.has_hallucination).length;
  }, [sentimentList]);

  if (loading) {
    return <LoadingScreen message="Analyzing sentiment & brand reputation alignment..." />;
  }

  // Map risk level string to canonical SeverityBadge severity
  const getRiskSeverity = (level: string): SeverityLevel => {
    const norm = level.toLowerCase();
    if (norm === 'high' || norm === 'critical') return 'critical';
    if (norm === 'medium') return 'medium';
    return 'positive';
  };

  return (
    <SidebarLayout activeItem="sentiment">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        {/* Page Hero Header Banner */}
        <PremiumCard padding="large" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,164,122,0.14),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(27,79,216,0.14),transparent_32%)]" />
          <div className="relative flex flex-col gap-4 border-b border-border-color pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent-blue">
                  V2 Sentiment Intelligence
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
                Brand Sentiment & Reputation Audit
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-secondary">
                Granular sentiment breakdown and reputation risk analysis across LLM model responses.
              </p>
            </div>
            {reputation && (
              <SeverityBadge
                severity={getRiskSeverity(reputation.risk_level)}
                label={`Risk: ${reputation.risk_level}`}
              />
            )}
          </div>
        </PremiumCard>

        {/* Error State */}
        {error && (
          <PremiumCard error={error} />
        )}

        {reputation && (
          <div className="space-y-6">
            {/* 1. Primary "At-a-Glance" MetricStat Row (Fully Deduplicated 4-Card Grid) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricStat
                label="Reputation Score"
                value={reputation.reputation_score}
                valueFormat="score"
                contextText="Favorable brand sentiment alignment"
                accentColor={reputation.reputation_score >= 60 ? 'positive' : 'medium'}
              />

              <MetricStat
                label="Negative Sentiment"
                value={reputation.negative_pct}
                valueFormat="percent"
                contextText="Prompts with risk or critical mentions"
                accentColor="critical"
              />

              <MetricStat
                label="Neutral Sentiment"
                value={reputation.neutral_pct}
                valueFormat="percent"
                contextText="Prompts with factual or non-evaluative mentions"
              />

              <MetricStat
                label="Hallucinations Detected"
                value={hallucinationCount}
                valueFormat="number"
                contextText="AI outputs containing factual inaccuracies"
                accentColor={hallucinationCount > 0 ? 'critical' : 'positive'}
              />
            </div>

            {/* 2. Standalone Visual Breakdown Row (SentimentDonut + RiskGauge) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <SentimentDonut
                positivePct={reputation.positive_pct}
                neutralPct={reputation.neutral_pct}
                negativePct={reputation.negative_pct}
                totalPrompts={sentimentList.length}
                className="lg:col-span-7"
              />

              <RiskGauge
                riskLevel={reputation.risk_level}
                className="lg:col-span-5"
              />
            </div>

            {/* 3. Slim Narrative Summary Context Bar */}
            <PremiumCard padding="standard">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Sentiment Audit Summary
                  </span>
                  <p className="text-sm font-medium text-white">
                    {reputation.narrative_summary}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-400">
                    {formatNumber(sentimentList.length)} prompts evaluated
                  </span>
                  <SeverityBadge
                    severity={getRiskSeverity(reputation.risk_level)}
                    label={`${reputation.risk_level} Risk`}
                  />
                </div>
              </div>
            </PremiumCard>

            {/* 4. Analyzed Sentiment Feed Container */}
            <PremiumCard padding="large">
              <div className="flex items-center justify-between border-b border-border-color pb-4 mb-4">
                <h3 className="text-base font-bold text-white">Analyzed Sentiment Feed</h3>
                <span className="text-xs font-mono text-slate-400">
                  {formatNumber(sentimentList.length)} entries
                </span>
              </div>

              <div className="divide-y divide-border-color">
                {sentimentList.map((item) => (
                  <div key={item.id} className="py-4 space-y-3 transition hover:bg-slate-900/30 px-2 rounded-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <SeverityBadge
                          severity={
                            item.sentiment === 'positive'
                              ? 'positive'
                              : item.sentiment === 'negative'
                              ? 'critical'
                              : 'info'
                          }
                          label={item.sentiment}
                        />
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                          Method: {item.classification_method || 'LLM'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Score: {formatScore(item.sentiment_score * 100)}
                      </span>
                    </div>

                    {item.has_hallucination && (
                      <PremiumCard accentColor="critical" padding="standard" className="mt-2">
                        <div className="flex items-start gap-2.5">
                          <SeverityBadge severity="critical" label="Hallucination Detected" />
                          <p className="text-xs font-medium text-red-200">
                            {item.hallucination_text || 'Inaccurate or unverified factual claim in AI response'}
                          </p>
                        </div>
                      </PremiumCard>
                    )}
                  </div>
                ))}

                {sentimentList.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No sentiment feed items found for this scan job.
                  </div>
                )}
              </div>
            </PremiumCard>
          </div>
        )}
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
