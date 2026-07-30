'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';

interface PageProps {
  params: Promise<{ brandId: string }>;
}

interface AlertItem {
  id: string;
  brand_id: string;
  alert_type: string;
  severity: string; // critical | high | medium | low
  title: string;
  body: string;
  data_json: Record<string, unknown>;
  delivered_at: string;
  dismissed_at?: string | null;
  created_at: string;
}

interface AlertSetting {
  id?: string;
  brand_id: string;
  alert_type: string;
  enabled: boolean;
  threshold_pct?: number | null;
  channels: string[];
  slack_webhook_url?: string | null;
  custom_webhook_url?: string | null;
}

const ALERT_TYPES = [
  {
    type: 'visibility_drop',
    label: 'Visibility Score Drop',
    description: 'Triggers when AI visibility score drops by more than the threshold percentage.',
    defaultThreshold: 10.0,
    hasThreshold: true,
  },
  {
    type: 'competitor_surge',
    label: 'Competitor Surge',
    description: 'Triggers when a tracked competitor gains significant mention share in LLM outputs.',
    defaultThreshold: 15.0,
    hasThreshold: true,
  },
  {
    type: 'hallucination_detected',
    label: 'LLM Hallucination Detected',
    description: 'Triggers immediately whenever an ungrounded or false claim is identified.',
    defaultThreshold: null,
    hasThreshold: false,
  },
  {
    type: 'budget_cap',
    label: 'Scan Expenditure Cap',
    description: 'Triggers when scan job costs reach the specified percentage of budget.',
    defaultThreshold: 80.0,
    hasThreshold: true,
  },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function getSeverityBadge(severity: string) {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#DC2626]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626] animate-pulse" />
        {severity}
      </span>
    );
  }
  if (s === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#D97706]/40 bg-[#D97706]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
        {severity}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
      {severity}
    </span>
  );
}

function AlertsPageContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const brandId = resolvedParams.brandId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alerts Feed State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);

  // Settings State
  const [settingsMap, setSettingsMap] = useState<Record<string, AlertSetting>>({});
  const [slackWebhook, setSlackWebhook] = useState('');
  const [customWebhook, setCustomWebhook] = useState('');

  // Form submitting states
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSettingsMsg, setSaveSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Slack Test state
  const [testingSlack, setTestingSlack] = useState(false);
  const [slackTestMsg, setSlackTestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const buildHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Alerts
      const alertsUrl = `${API_BASE_URL}/api/v1/alerts/${encodeURIComponent(brandId)}${
        filterActiveOnly ? '?dismissed=false' : ''
      }`;
      const alertsRes = await fetch(alertsUrl, { headers: buildHeaders() });
      if (!alertsRes.ok) throw new Error('Failed to fetch alerts feed.');
      const alertsData: AlertItem[] = await alertsRes.json();
      setAlerts(alertsData);

      // 2. Fetch Settings
      const settingsRes = await fetch(`${API_BASE_URL}/api/v1/alerts/${encodeURIComponent(brandId)}/settings`, {
        headers: buildHeaders(),
      });
      if (!settingsRes.ok) throw new Error('Failed to fetch alert settings.');
      const settingsData: AlertSetting[] = await settingsRes.json();

      // Build dictionary per alert_type
      const map: Record<string, AlertSetting> = {};
      let sharedSlack = '';
      let sharedWebhook = '';

      ALERT_TYPES.forEach((at) => {
        const found = settingsData.find((s) => s.alert_type === at.type);
        if (found) {
          map[at.type] = found;
          if (found.slack_webhook_url && !sharedSlack) sharedSlack = found.slack_webhook_url;
          if (found.custom_webhook_url && !sharedWebhook) sharedWebhook = found.custom_webhook_url;
        } else {
          map[at.type] = {
            brand_id: brandId,
            alert_type: at.type,
            enabled: true,
            threshold_pct: at.defaultThreshold,
            channels: ['email'],
          };
        }
      });

      setSettingsMap(map);
      if (sharedSlack) setSlackWebhook(sharedSlack);
      if (sharedWebhook) setCustomWebhook(sharedWebhook);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading alerts module.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && brandId) {
      localStorage.setItem('lastBrandId', brandId);
    }
    loadData();
  }, [brandId, filterActiveOnly]);

  const handleDismissAlert = async (alertId: string) => {
    // Optimistic UI update: mark as dismissed in local state immediately
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed_at: new Date().toISOString() } : a))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
        headers: buildHeaders(),
      });
      if (!res.ok) {
        throw new Error('Failed to dismiss alert.');
      }
    } catch (err: unknown) {
      // Revert if API fails
      loadData();
      console.error(err);
    }
  };

  const handleSettingChange = (type: string, field: keyof AlertSetting, value: unknown) => {
    setSettingsMap((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleChannelToggle = (type: string, channel: string) => {
    setSettingsMap((prev) => {
      const currentChannels = prev[type]?.channels || [];
      const updatedChannels = currentChannels.includes(channel)
        ? currentChannels.filter((c) => c !== channel)
        : [...currentChannels, channel];
      return {
        ...prev,
        [type]: {
          ...prev[type],
          channels: updatedChannels,
        },
      };
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSaveSettingsMsg(null);

      // Save setting for each alert type
      const promises = ALERT_TYPES.map((at) => {
        const setting = settingsMap[at.type];
        const payload = {
          alert_type: at.type,
          enabled: setting.enabled,
          threshold_pct: at.hasThreshold ? setting.threshold_pct : null,
          channels: setting.channels,
          slack_webhook_url: setting.channels.includes('slack') ? slackWebhook.trim() || null : null,
          custom_webhook_url: setting.channels.includes('webhook') ? customWebhook.trim() || null : null,
        };

        return fetch(`${API_BASE_URL}/api/v1/alerts/${encodeURIComponent(brandId)}/settings`, {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify(payload),
        });
      });

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        throw new Error('Failed to save some alert settings.');
      }

      setSaveSettingsMsg({ type: 'success', text: 'Alert configurations saved successfully!' });
      await loadData();
    } catch (err: unknown) {
      setSaveSettingsMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save settings.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestSlack = async () => {
    if (!slackWebhook.trim()) {
      setSlackTestMsg({ type: 'error', text: 'Please enter a Slack Webhook URL first.' });
      return;
    }

    try {
      setTestingSlack(true);
      setSlackTestMsg(null);

      const res = await fetch(`${API_BASE_URL}/api/v1/alerts/test/slack`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          webhook_url: slackWebhook.trim(),
          brand_name: brandId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSlackTestMsg({ type: 'success', text: 'Test Slack alert dispatched successfully!' });
      } else {
        setSlackTestMsg({ type: 'error', text: data.error || data.message || 'Failed to deliver test message.' });
      }
    } catch (err: unknown) {
      setSlackTestMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error sending test Slack alert.',
      });
    } finally {
      setTestingSlack(false);
    }
  };

  const visibleAlerts = filterActiveOnly
    ? alerts.filter((a) => !a.dismissed_at)
    : alerts;

  if (loading) {
    return <LoadingScreen message="Loading advanced alert system..." />;
  }

  const isSlackEnabledAnywhere = Object.values(settingsMap).some((s) => s.channels?.includes('slack'));
  const isWebhookEnabledAnywhere = Object.values(settingsMap).some((s) => s.channels?.includes('webhook'));

  return (
    <SidebarLayout activeItem="dashboard">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.14),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(27,79,216,0.12),transparent_35%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#DC2626]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#DC2626]">
                  V2 Security & Monitoring
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
                Advanced AI Visibility Alerts
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-secondary">
                Real-time monitoring engine for visibility drops, competitor surges, LLM hallucinations, and scan expenditure caps.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* SECTION 1: ALERT FEED */}
        <div className="rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
          <div className="flex flex-col gap-3 border-b border-border-color pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Live Alert Feed</h2>
              <p className="text-xs text-secondary">
                Recent intelligence alerts triggered during scan evaluations.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border-color bg-slate-950/70 p-1 text-xs">
              <button
                onClick={() => setFilterActiveOnly(true)}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  filterActiveOnly
                    ? 'bg-[#1B4FD8] text-white shadow'
                    : 'text-secondary hover:text-white'
                }`}
              >
                Active Only
              </button>
              <button
                onClick={() => setFilterActiveOnly(false)}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  !filterActiveOnly
                    ? 'bg-[#1B4FD8] text-white shadow'
                    : 'text-secondary hover:text-white'
                }`}
              >
                All History
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {visibleAlerts.length === 0 ? (
              <div className="rounded-2xl border border-border-color/60 bg-slate-950/40 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-3 text-sm font-bold text-white">No active alerts</h3>
                <p className="mt-1 text-xs text-secondary">
                  Your AI visibility is stable across all monitored LLMs and no threshold breaches have occurred.
                </p>
              </div>
            ) : (
              visibleAlerts.map((alert) => {
                const isDismissed = Boolean(alert.dismissed_at);
                return (
                  <div
                    key={alert.id}
                    className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition sm:flex-row sm:items-center sm:justify-between ${
                      isDismissed
                        ? 'border-border-color/40 bg-slate-950/30 opacity-60'
                        : 'border-border-color/80 bg-slate-950/70 hover:border-border-color'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          {alert.alert_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">• {formatDate(alert.delivered_at || alert.created_at)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                      <p className="text-xs leading-relaxed text-slate-300">{alert.body}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {isDismissed ? (
                        <span className="text-[11px] font-semibold text-slate-500">Dismissed</span>
                      ) : (
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="rounded-xl border border-border-color bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 2: ALERT SETTINGS */}
        <div className="rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
          <div className="border-b border-border-color pb-4">
            <h2 className="text-lg font-bold text-white">Alert Thresholds & Channel Rules</h2>
            <p className="text-xs text-secondary">
              Configure detection sensitivities and multi-channel notification routing (Email, Slack, Webhook).
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="mt-6 space-y-6">
            <div className="space-y-6 divide-y divide-border-color/60">
              {ALERT_TYPES.map((at) => {
                const setting = settingsMap[at.type] || {
                  brand_id: brandId,
                  alert_type: at.type,
                  enabled: true,
                  threshold_pct: at.defaultThreshold,
                  channels: ['email'],
                };

                return (
                  <div key={at.type} className="pt-6 first:pt-0">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="max-w-md space-y-1">
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={setting.enabled}
                              onChange={(e) => handleSettingChange(at.type, 'enabled', e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="peer h-5 w-9 rounded-full bg-slate-800 transition after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-slate-400 after:transition-all peer-checked:bg-[#1B4FD8] peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                          </label>
                          <h3 className="text-sm font-bold text-white">{at.label}</h3>
                        </div>
                        <p className="text-xs text-secondary pl-12">{at.description}</p>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center pl-12 md:pl-0">
                        {/* Threshold Input */}
                        {at.hasThreshold && (
                          <div className="w-36">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Threshold (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              disabled={!setting.enabled}
                              value={setting.threshold_pct ?? at.defaultThreshold ?? 10.0}
                              onChange={(e) =>
                                handleSettingChange(
                                  at.type,
                                  'threshold_pct',
                                  e.target.value ? parseFloat(e.target.value) : 0
                                )
                              }
                              className="mt-1 w-full rounded-xl border border-border-color bg-slate-950/80 px-3 py-1.5 text-xs text-white disabled:opacity-40 focus:border-[#1B4FD8] focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Delivery Channels */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Channels
                          </label>
                          <div className="mt-1.5 flex items-center gap-3 text-xs">
                            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!setting.enabled}
                                checked={setting.channels?.includes('email')}
                                onChange={() => handleChannelToggle(at.type, 'email')}
                                className="rounded border-border-color bg-slate-900 text-[#1B4FD8] focus:ring-0"
                              />
                              Email
                            </label>

                            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!setting.enabled}
                                checked={setting.channels?.includes('slack')}
                                onChange={() => handleChannelToggle(at.type, 'slack')}
                                className="rounded border-border-color bg-slate-900 text-[#1B4FD8] focus:ring-0"
                              />
                              Slack
                            </label>

                            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!setting.enabled}
                                checked={setting.channels?.includes('webhook')}
                                onChange={() => handleChannelToggle(at.type, 'webhook')}
                                className="rounded border-border-color bg-slate-900 text-[#1B4FD8] focus:ring-0"
                              />
                              Webhook
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Webhook URLs Configuration */}
            {(isSlackEnabledAnywhere || isWebhookEnabledAnywhere) && (
              <div className="space-y-4 rounded-2xl border border-border-color/80 bg-slate-950/60 p-5 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Integration Webhook Endpoints
                </h4>

                {isSlackEnabledAnywhere && (
                  <div>
                    <label className="block text-xs font-semibold text-secondary">Slack Webhook URL</label>
                    <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="url"
                        placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXX"
                        value={slackWebhook}
                        onChange={(e) => setSlackWebhook(e.target.value)}
                        className="w-full rounded-xl border border-border-color bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleTestSlack}
                        disabled={testingSlack || !slackWebhook.trim()}
                        className="shrink-0 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {testingSlack ? 'Testing...' : 'Send Test Alert'}
                      </button>
                    </div>
                    {slackTestMsg && (
                      <p
                        className={`mt-1.5 text-xs font-semibold ${
                          slackTestMsg.type === 'success' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {slackTestMsg.text}
                      </p>
                    )}
                  </div>
                )}

                {isWebhookEnabledAnywhere && (
                  <div>
                    <label className="block text-xs font-semibold text-secondary">Custom Webhook URL</label>
                    <input
                      type="url"
                      placeholder="https://api.yourdomain.com/webhooks/oryq-alerts"
                      value={customWebhook}
                      onChange={(e) => setCustomWebhook(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border-color bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      ORYQ posts JSON alert payloads signed with HMAC-SHA256 (`X-ORYQ-Signature`).
                    </p>
                  </div>
                )}
              </div>
            )}

            {saveSettingsMsg && (
              <div
                className={`rounded-xl border p-3 text-xs font-semibold ${
                  saveSettingsMsg.type === 'success'
                    ? 'border-green-500/30 bg-green-500/10 text-green-300'
                    : 'border-red-500/30 bg-red-500/10 text-red-300'
                }`}
              >
                {saveSettingsMsg.text}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="rounded-xl bg-[#1B4FD8] px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#153eb2] disabled:opacity-50"
              >
                {savingSettings ? 'Saving Alert Configurations...' : 'Save Alert Configurations'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function AlertsPage(props: PageProps) {
  return (
    <ProtectedRoute>
      <AlertsPageContent {...props} />
    </ProtectedRoute>
  );
}
