'use client';

import React, { useEffect, useMemo, useState, use } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';
import PremiumCard from '@/components/ui/PremiumCard';
import MetricStat from '@/components/ui/MetricStat';
import SeverityBadge from '@/components/ui/SeverityBadge';
import {
  formatCurrency,
  formatScore,
  formatPercent,
  formatNumber,
} from '@/lib/utils/formatters';

interface PageProps {
  params: Promise<{ brandId: string }>;
}

interface RevenueIntelligenceResponse {
  estimated_ai_revenue: number;
  missed_revenue: number;
  competitor_deals_lost: number;
  revenue_per_visibility_point: number;
  insight_text: string;
  current_visibility_score: number;
  currency: string;
}

interface RevenueSettingsResponse {
  id?: string;
  brand_id: string;
  avg_deal_value: number;
  monthly_website_traffic: number;
  ai_traffic_percentage: number;
  conversion_rate: number;
  currency: string;
  updated_at?: string;
}

interface RevenueHistoryItem {
  month: string;
  estimated_ai_revenue: number;
  missed_revenue: number;
  visibility_score: number;
  created_at: string;
}

interface RevenueSettingsFormState {
  avg_deal_value: string;
  monthly_website_traffic: string;
  ai_traffic_percentage: string;
  conversion_rate: string;
  currency: 'INR' | 'USD';
}

type TabType = 'overview' | 'history' | 'settings';

const DEFAULT_SETTINGS: RevenueSettingsFormState = {
  avg_deal_value: '50000',
  monthly_website_traffic: '10000',
  ai_traffic_percentage: '15',
  conversion_rate: '0.02',
  currency: 'INR',
};

function toNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function buildTrendPath(items: RevenueHistoryItem[]) {
  if (items.length < 2) return '';
  const width = 600;
  const height = 220;
  const padding = 20;
  const minValue = Math.min(...items.map((item) => item.estimated_ai_revenue));
  const maxValue = Math.max(...items.map((item) => item.estimated_ai_revenue));
  const range = Math.max(1, maxValue - minValue);

  return items
    .map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / (items.length - 1);
      const y = height - padding - ((item.estimated_ai_revenue - minValue) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function RevenuePageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const brandId = resolvedParams.brandId;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [intelligence, setIntelligence] = useState<RevenueIntelligenceResponse | null>(null);
  const [history, setHistory] = useState<RevenueHistoryItem[]>([]);
  const [settings, setSettings] = useState<RevenueSettingsResponse | null>(null);
  const [form, setForm] = useState<RevenueSettingsFormState>(DEFAULT_SETTINGS);

  const buildHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const syncFormFromSettings = (data: RevenueSettingsResponse) => {
    setForm({
      avg_deal_value: String(data.avg_deal_value ?? DEFAULT_SETTINGS.avg_deal_value),
      monthly_website_traffic: String(data.monthly_website_traffic ?? DEFAULT_SETTINGS.monthly_website_traffic),
      ai_traffic_percentage: String(data.ai_traffic_percentage ?? DEFAULT_SETTINGS.ai_traffic_percentage),
      conversion_rate: String(data.conversion_rate ?? DEFAULT_SETTINGS.conversion_rate),
      currency: (data.currency === 'USD' ? 'USD' : 'INR'),
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [intelRes, historyRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/revenue/${brandId}/intelligence`, { headers: buildHeaders() }),
        fetch(`${API_BASE_URL}/api/v1/revenue/${brandId}/history`, { headers: buildHeaders() }),
        fetch(`${API_BASE_URL}/api/v1/revenue/${brandId}/settings`, { headers: buildHeaders() }),
      ]);

      if (!intelRes.ok) throw new Error('Failed to load revenue intelligence.');
      if (!historyRes.ok) throw new Error('Failed to load revenue history.');
      if (!settingsRes.ok) throw new Error('Failed to load revenue settings.');

      const [intelData, historyData, settingsData] = await Promise.all([
        intelRes.json(),
        historyRes.json(),
        settingsRes.json(),
      ]);

      setIntelligence(intelData);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setSettings(settingsData);
      syncFormFromSettings(settingsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading revenue intelligence.');
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

  const hasHistoryTrend = history.length > 1;
  const trendPath = useMemo(() => buildTrendPath(history), [history]);

  const currencyCode = (intelligence?.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';

  // Calculate monthly AI leads for summary
  const monthlyAiLeads = useMemo(() => {
    if (!settings) return 0;
    const traffic = settings.monthly_website_traffic || 10000;
    const aiPct = settings.ai_traffic_percentage || 15;
    return Math.round(traffic * (aiPct / 100));
  }, [settings]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    try {
      const payload = {
        avg_deal_value: toNumber(form.avg_deal_value, 50000),
        monthly_website_traffic: Math.round(toNumber(form.monthly_website_traffic, 10000)),
        ai_traffic_percentage: toNumber(form.ai_traffic_percentage, 15),
        conversion_rate: toNumber(form.conversion_rate, 0.02),
        currency: form.currency,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/revenue/${brandId}/settings`, {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.detail || 'Failed to save revenue settings.');
      }

      const body = await res.json();
      const updatedSettings = body?.settings as RevenueSettingsResponse | undefined;
      if (updatedSettings) {
        setSettings(updatedSettings);
        syncFormFromSettings(updatedSettings);
      }
      setSaveSuccess('Revenue settings saved successfully.');
      await fetchData();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading revenue intelligence..." />;
  }

  return (
    <SidebarLayout activeItem="revenue">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        {/* Page Hero Header Banner */}
        <PremiumCard padding="large" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(27,79,216,0.14),transparent_28%)]" />
          <div className="relative flex flex-col gap-5 border-b border-border-color pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                  Financial Impact Model
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
                Revenue Intelligence
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-secondary">
                Translate AI visibility into estimated revenue impact, opportunity at risk, and actionable conversion dynamics.
              </p>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 rounded-xl border border-border-color bg-card-light p-1">
              {(['overview', 'history', 'settings'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition cursor-pointer ${
                    activeTab === tab
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </PremiumCard>

        {/* Error State */}
        {error && (
          <PremiumCard error={error} onRetry={fetchData} />
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && intelligence && settings && (
          <div className="space-y-6">
            {/* 1. Primary "At-a-Glance" MetricStat Row (4 Cards) */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricStat
                label="Estimated AI Revenue"
                value={intelligence.estimated_ai_revenue}
                valueFormat="currency"
                currency={currencyCode}
                contextText="Expected monthly AI-driven revenue"
                accentColor="positive"
              />

              <MetricStat
                label="Revenue at Risk"
                value={intelligence.missed_revenue}
                valueFormat="currency"
                currency={currencyCode}
                contextText={`Opportunity lost due to ${formatPercent(100 - intelligence.current_visibility_score, false)} uncaptured demand`}
                accentColor="critical"
              />

              <MetricStat
                label="Competitor Deals Lost"
                value={intelligence.competitor_deals_lost}
                valueFormat="number"
                contextText="Monthly deal conversations steered to rivals"
                accentColor="medium"
              />

              <MetricStat
                label="Monthly AI Leads"
                value={monthlyAiLeads}
                valueFormat="number"
                contextText={`Based on ${formatNumber(settings.monthly_website_traffic)} traffic & ${formatPercent(settings.ai_traffic_percentage, false)} AI share`}
              />
            </div>

            {/* 2. Business Translation Context Banner */}
            <PremiumCard padding="standard">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Business Impact Translation
                  </span>
                  <p className="text-sm font-semibold text-white">
                    Each visibility point is worth{' '}
                    <span className="font-mono text-amber-400">
                      {formatCurrency(intelligence.revenue_per_visibility_point, currencyCode)}
                    </span>
                    /month in AI-driven pipeline.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400">
                    Visibility Score:{' '}
                    <strong className="text-white font-mono">{formatScore(intelligence.current_visibility_score)}</strong>
                  </span>
                  <SeverityBadge
                    severity={intelligence.current_visibility_score >= 60 ? 'positive' : 'medium'}
                    label={intelligence.current_visibility_score >= 60 ? 'Healthy Visibility' : 'Action Required'}
                  />
                </div>
              </div>
            </PremiumCard>

            {/* 3. Revenue Insight Card */}
            <PremiumCard>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Strategic Revenue Insight
              </h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium">
                {intelligence.insight_text}
              </p>
            </PremiumCard>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <PremiumCard padding="large">
              <div className="flex items-center justify-between border-b border-border-color pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Revenue Trajectory History</h3>
                  <p className="mt-1 text-xs text-secondary">Chronological scan-to-scan financial trajectory.</p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {formatNumber(history.length)} scan data points
                </span>
              </div>

              {hasHistoryTrend ? (
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Time-Series Line Trend Visualization */}
                  <div className="lg:col-span-7 rounded-xl border border-border-color/70 bg-slate-950/50 p-4">
                    <svg viewBox="0 0 600 220" className="h-56 w-full">
                      <defs>
                        <linearGradient id="revenueLine" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#D97706" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#1B4FD8" stopOpacity="0.9" />
                        </linearGradient>
                      </defs>
                      <line x1="20" y1="200" x2="580" y2="200" stroke="#334155" strokeWidth="1" />
                      <path d={trendPath} fill="none" stroke="url(#revenueLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      {history.map((item, index) => {
                        const width = 600;
                        const height = 220;
                        const padding = 20;
                        const minValue = Math.min(...history.map((entry) => entry.estimated_ai_revenue));
                        const maxValue = Math.max(...history.map((entry) => entry.estimated_ai_revenue));
                        const range = Math.max(1, maxValue - minValue);
                        const x = padding + (index * (width - padding * 2)) / Math.max(1, history.length - 1);
                        const y = height - padding - ((item.estimated_ai_revenue - minValue) / range) * (height - padding * 2);

                        return <circle key={item.created_at || `${item.month}-${index}`} cx={x} cy={y} r="5" fill="#D97706" />;
                      })}
                    </svg>
                  </div>

                  {/* Clean History Log List */}
                  <div className="lg:col-span-5 overflow-hidden rounded-xl border border-border-color/70">
                    <div className="divide-y divide-border-color/70">
                      {history.map((item) => (
                        <div key={`${item.created_at}-${item.month}`} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
                          <div>
                            <div className="text-sm font-bold text-white">{item.month}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Visibility {formatScore(item.visibility_score)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-bold text-white">
                              {formatCurrency(item.estimated_ai_revenue, currencyCode)}
                            </div>
                            <div className="text-[11px] font-mono text-amber-400">
                              {formatCurrency(item.missed_revenue, currencyCode)} missed
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-border-color/60 bg-slate-950/50 p-6 text-sm text-secondary">
                  Not enough historical scans yet. Once subsequent scans run, trajectory lines will populate automatically.
                </div>
              )}
            </PremiumCard>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <PremiumCard padding="large">
            <div className="border-b border-border-color pb-4">
              <h3 className="text-base font-bold text-white">Financial Impact Assumptions</h3>
              <p className="mt-1 text-xs text-secondary">
                Configure your deal metrics and traffic baselines to calibrate the AI revenue impact engine.
              </p>
            </div>

            {saveError && (
              <div className="mt-4 rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/10 p-4 text-xs font-semibold text-red-300">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="mt-4 rounded-xl border border-[#0EA47A]/30 bg-[#0EA47A]/10 p-4 text-xs font-semibold text-green-300">
                {saveSuccess}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Average Deal Value ({form.currency})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.avg_deal_value}
                    onChange={(event) => setForm((current) => ({ ...current, avg_deal_value: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Monthly Website Traffic
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.monthly_website_traffic}
                    onChange={(event) => setForm((current) => ({ ...current, monthly_website_traffic: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    AI Traffic Percentage (%)
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.ai_traffic_percentage}
                    onChange={(event) => setForm((current) => ({ ...current, ai_traffic_percentage: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Conversion Rate (Decimal, e.g. 0.02)
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.001"
                    value={form.conversion_rate}
                    onChange={(event) => setForm((current) => ({ ...current, conversion_rate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Model Currency
                  </span>
                  <select
                    value={form.currency}
                    onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as 'INR' | 'USD' }))}
                    className="w-full rounded-xl border border-slate-700 bg-card-light px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border-color pt-6">
                <p className="text-xs text-slate-400">
                  Assumptions apply brand-wide. Saving immediately recalculates financial impact models.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-accent-blue px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </PremiumCard>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function RevenuePage(props: PageProps) {
  return (
    <ProtectedRoute>
      <RevenuePageContent {...props} />
    </ProtectedRoute>
  );
}
