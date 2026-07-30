'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

interface WorkspaceBrand {
  brand_id: string;
  client_name: string;
  latest_score: number;
  created_at: string;
}

interface WhitelabelConfig {
  id?: string;
  workspace_id: string;
  agency_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  report_footer: string;
}

function formatScore(score: number) {
  return `${score.toFixed(1)}%`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(d);
}

function SingleWorkspaceContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const workspaceId = resolvedParams.workspaceId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [brands, setBrands] = useState<WorkspaceBrand[]>([]);
  const [whitelabel, setWhitelabel] = useState<WhitelabelConfig>({
    workspace_id: workspaceId,
    agency_name: 'ORYQ Partner Agency',
    logo_url: '',
    primary_color: '#1B4FD8',
    secondary_color: '#0EA47A',
    report_footer: 'Confidential Executive Report — Powered by ORYQ Intelligence Engine',
  });

  // Add Brand state
  const [newBrandId, setNewBrandId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  const [addBrandError, setAddBrandError] = useState<string | null>(null);
  const [addBrandSuccess, setAddBrandSuccess] = useState<string | null>(null);

  // Whitelabel form state
  const [savingWhitelabel, setSavingWhitelabel] = useState(false);
  const [whitelabelMsg, setWhitelabelMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // PDF report loading state per brand
  const [generatingPdfBrandId, setGeneratingPdfBrandId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const buildHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch workspace brands
      const brandsRes = await fetch(`${API_BASE_URL}/api/v1/agency/workspaces/${workspaceId}/brands`, {
        headers: buildHeaders(),
      });
      if (!brandsRes.ok) throw new Error('Failed to fetch workspace client brands.');
      const brandsData: WorkspaceBrand[] = await brandsRes.json();
      setBrands(brandsData);

      // Fetch whitelabel config
      const wlRes = await fetch(`${API_BASE_URL}/api/v1/agency/${workspaceId}/whitelabel`, {
        headers: buildHeaders(),
      });

      if (wlRes.ok) {
        const wlData: WhitelabelConfig = await wlRes.json();
        setWhitelabel({
          ...wlData,
          logo_url: wlData.logo_url || '',
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading workspace details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandId.trim()) return;

    try {
      setAddingBrand(true);
      setAddBrandError(null);
      setAddBrandSuccess(null);

      const res = await fetch(`${API_BASE_URL}/api/v1/agency/workspaces/${workspaceId}/brands`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          brand_id: newBrandId.trim(),
          client_name: newClientName.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to attach brand to workspace.');
      }

      setAddBrandSuccess('Client brand attached successfully.');
      setNewBrandId('');
      setNewClientName('');
      await loadWorkspaceData();
    } catch (err: unknown) {
      setAddBrandError(err instanceof Error ? err.message : 'Failed to add brand.');
    } finally {
      setAddingBrand(false);
    }
  };

  const handleSaveWhitelabel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingWhitelabel(true);
      setWhitelabelMsg(null);

      const res = await fetch(`${API_BASE_URL}/api/v1/agency/${workspaceId}/whitelabel`, {
        method: 'PATCH',
        headers: buildHeaders(),
        body: JSON.stringify({
          agency_name: whitelabel.agency_name.trim() || undefined,
          logo_url: whitelabel.logo_url?.trim() || null,
          primary_color: whitelabel.primary_color,
          secondary_color: whitelabel.secondary_color,
          report_footer: whitelabel.report_footer.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to update whitelabel settings.');
      }

      const updated: WhitelabelConfig = await res.json();
      setWhitelabel({
        ...updated,
        logo_url: updated.logo_url || '',
      });
      setWhitelabelMsg({ type: 'success', text: 'Branding configuration saved successfully!' });
    } catch (err: unknown) {
      setWhitelabelMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error saving whitelabel config.',
      });
    } finally {
      setSavingWhitelabel(false);
    }
  };

  const handleGenerateReport = async (brandId: string) => {
    try {
      setGeneratingPdfBrandId(brandId);
      setPdfError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/v1/agency/${workspaceId}/report/${brandId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to generate PDF report.');
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err: unknown) {
      setPdfError(err instanceof Error ? err.message : 'Error generating PDF report.');
    } finally {
      setGeneratingPdfBrandId(null);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading workspace management dashboard..." />;
  }

  return (
    <SidebarLayout activeItem="dashboard">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
        {/* Navigation Breadcrumb & Header */}
        <div>
          <Link
            href="/workspaces"
            className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-white"
          >
            ← Back to Workspaces
          </Link>
          <div className="mt-3 relative overflow-hidden rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(27,79,216,0.16),transparent_40%)]" />
            <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B4FD8]">
                  Workspace Management
                </span>
                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
                  {whitelabel.agency_name || 'Agency Workspace'}
                </h1>
                <p className="mt-1 text-xs text-secondary">
                  Manage client accounts, configure custom PDF white-labeling, and export executive audit reports.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                  {brands.length} {brands.length === 1 ? 'Client Brand' : 'Client Brands'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
            <span>{error}</span>
            <button
              onClick={loadWorkspaceData}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* SECTION 1: Client Brands & Add Client Form */}
        <div className="rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
          <div className="flex flex-col gap-2 border-b border-border-color pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Client Brands Portfolio</h2>
              <p className="text-xs text-secondary">
                Attach brands to this workspace to generate agency reports and track client visibility.
              </p>
            </div>
          </div>

          {/* Add Client Form */}
          <form onSubmit={handleAddBrand} className="mt-6 rounded-2xl border border-border-color/70 bg-slate-950/60 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attach Client Brand</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-secondary">Brand ID (UUID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={newBrandId}
                  onChange={(e) => setNewBrandId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border-color bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-secondary">Client Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Inc."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border-color bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={addingBrand}
                  className="w-full rounded-xl bg-[#1B4FD8] py-2 text-xs font-bold text-white hover:bg-[#153eb2] disabled:opacity-50"
                >
                  {addingBrand ? 'Attaching...' : 'Attach Brand'}
                </button>
              </div>
            </div>

            {addBrandError && (
              <p className="mt-2 text-xs text-red-400">{addBrandError}</p>
            )}
            {addBrandSuccess && (
              <p className="mt-2 text-xs text-green-400">{addBrandSuccess}</p>
            )}
          </form>

          {/* Client Brands List Table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-border-color/70">
            {brands.length === 0 ? (
              <div className="p-8 text-center text-xs text-secondary">
                No client brands attached to this workspace yet. Use the form above to add a client brand.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border-color/70 bg-slate-950/80 uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Client Name</th>
                      <th className="px-5 py-3.5 font-bold">Brand ID</th>
                      <th className="px-5 py-3.5 font-bold">Latest Score</th>
                      <th className="px-5 py-3.5 font-bold">Attached Date</th>
                      <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/60 bg-card/40">
                    {brands.map((b) => (
                      <tr key={b.brand_id} className="transition hover:bg-white/5">
                        <td className="px-5 py-4 font-bold text-white">{b.client_name}</td>
                        <td className="px-5 py-4 font-mono text-[11px] text-slate-400">{b.brand_id}</td>
                        <td className="px-5 py-4 font-mono font-bold text-green-400">
                          {formatScore(b.latest_score)}
                        </td>
                        <td className="px-5 py-4 text-slate-400">{formatDate(b.created_at)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleGenerateReport(b.brand_id)}
                            disabled={generatingPdfBrandId === b.brand_id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B4FD8]/20 px-3 py-1.5 text-xs font-bold text-sky-300 transition hover:bg-[#1B4FD8]/40 disabled:opacity-50"
                          >
                            {generatingPdfBrandId === b.brand_id ? (
                              'Generating...'
                            ) : (
                              <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Export PDF Report
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: White-Label Branding Settings + Live Mockup Preview */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Settings Form */}
          <div className="lg:col-span-7 rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
            <div className="border-b border-border-color pb-4">
              <h2 className="text-lg font-bold text-white">White-Label Report Branding</h2>
              <p className="text-xs text-secondary">
                Configure your agency branding details. These settings dynamically apply to generated client PDF reports.
              </p>
            </div>

            <form onSubmit={handleSaveWhitelabel} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300">Agency Name</label>
                <input
                  type="text"
                  required
                  value={whitelabel.agency_name}
                  onChange={(e) => setWhitelabel({ ...whitelabel, agency_name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border-color bg-slate-950/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300">Logo Image URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={whitelabel.logo_url || ''}
                  onChange={(e) => setWhitelabel({ ...whitelabel, logo_url: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border-color bg-slate-950/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Enter a direct HTTP/HTTPS image URL for your agency logo.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-300">Primary Accent Color</label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      type="color"
                      value={whitelabel.primary_color}
                      onChange={(e) => setWhitelabel({ ...whitelabel, primary_color: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-border-color bg-transparent p-1"
                    />
                    <input
                      type="text"
                      value={whitelabel.primary_color}
                      onChange={(e) => setWhitelabel({ ...whitelabel, primary_color: e.target.value })}
                      className="w-full rounded-xl border border-border-color bg-slate-950/80 px-3 py-2 font-mono text-white focus:border-[#1B4FD8] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300">Secondary Accent Color</label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <input
                      type="color"
                      value={whitelabel.secondary_color}
                      onChange={(e) => setWhitelabel({ ...whitelabel, secondary_color: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-border-color bg-transparent p-1"
                    />
                    <input
                      type="text"
                      value={whitelabel.secondary_color}
                      onChange={(e) => setWhitelabel({ ...whitelabel, secondary_color: e.target.value })}
                      className="w-full rounded-xl border border-border-color bg-slate-950/80 px-3 py-2 font-mono text-white focus:border-[#1B4FD8] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300">Report Footer Text</label>
                <textarea
                  rows={2}
                  value={whitelabel.report_footer}
                  onChange={(e) => setWhitelabel({ ...whitelabel, report_footer: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border-color bg-slate-950/80 px-4 py-2.5 text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                />
              </div>

              {whitelabelMsg && (
                <div
                  className={`rounded-xl border p-3 text-xs font-semibold ${
                    whitelabelMsg.type === 'success'
                      ? 'border-green-500/30 bg-green-500/10 text-green-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  {whitelabelMsg.text}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingWhitelabel}
                  className="rounded-xl bg-[#1B4FD8] px-6 py-2.5 font-bold text-white hover:bg-[#153eb2] disabled:opacity-50 shadow-md"
                >
                  {savingWhitelabel ? 'Saving Configuration...' : 'Save Branding Config'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Mockup Preview */}
          <div className="lg:col-span-5 rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
            <div className="border-b border-border-color pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Preview</span>
              <h2 className="text-base font-bold text-white">PDF Report Header Mockup</h2>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-700 bg-white p-6 text-slate-900 shadow-xl">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: whitelabel.primary_color }}>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider" style={{ color: whitelabel.primary_color }}>
                    {whitelabel.agency_name || 'AGENCY NAME'}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">AI Visibility Executive Audit</div>
                </div>
                {whitelabel.logo_url ? (
                  <img src={whitelabel.logo_url} alt="Agency Logo" className="h-8 max-w-[100px] object-contain" />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: whitelabel.primary_color }}
                  >
                    {(whitelabel.agency_name || 'A')[0]}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Sample Client</div>
                    <div className="text-sm font-bold text-slate-800">Acme Global</div>
                  </div>
                  <div
                    className="rounded-lg px-3 py-1 text-center font-mono font-bold text-white text-xs"
                    style={{ backgroundColor: whitelabel.secondary_color }}
                  >
                    SCORE: 85/100
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-3 text-[9px] text-slate-400">
                {whitelabel.report_footer}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Per-Client Report Export List */}
        <div className="rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
          <div className="flex items-center justify-between border-b border-border-color pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">White-Labeled Report Generation</h2>
              <p className="text-xs text-secondary">
                Generate and download formatted PDF visibility reports for any client brand using your custom agency branding.
              </p>
            </div>
          </div>

          {pdfError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {pdfError}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <div
                key={b.brand_id}
                className="flex flex-col justify-between rounded-2xl border border-border-color/70 bg-slate-950/50 p-5 shadow-sm"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client Account</span>
                  <h4 className="mt-1 text-base font-bold text-white">{b.client_name}</h4>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400">Latest Score:</span>
                    <span className="font-mono font-bold text-green-400">{formatScore(b.latest_score)}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border-color/60">
                  <button
                    onClick={() => handleGenerateReport(b.brand_id)}
                    disabled={generatingPdfBrandId === b.brand_id}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4FD8] py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#153eb2] disabled:opacity-50"
                  >
                    {generatingPdfBrandId === b.brand_id ? (
                      'Generating PDF...'
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Export PDF Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default function SingleWorkspacePage(props: PageProps) {
  return (
    <ProtectedRoute>
      <SingleWorkspaceContent {...props} />
    </ProtectedRoute>
  );
}
