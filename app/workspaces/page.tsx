'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/api';

interface Workspace {
  id: string;
  owner_user_id: string;
  name: string;
  plan_tier: string;
  client_count: number;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(d);
}

function WorkspacesContent() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const buildHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/v1/agency/workspaces`, {
        headers: buildHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch agency workspaces.');
      const data: Workspace[] = await res.json();
      setWorkspaces(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreating(true);
      setCreateError(null);
      const res = await fetch(`${API_BASE_URL}/api/v1/agency/workspaces`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to create workspace.');
      }

      const created: Workspace = await res.json();
      setWorkspaces((prev) => [created, ...prev]);
      setNewWorkspaceName('');
      setCreateModalOpen(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create workspace.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading agency workspaces..." />;
  }

  return (
    <SidebarLayout activeItem="dashboard">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl border border-border-color bg-card p-6 shadow-md md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(27,79,216,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(14,164,122,0.12),transparent_35%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1B4FD8]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B4FD8]">
                  Agency Suite
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
                Agency Workspaces
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-secondary">
                Separate client organizations, configure white-label report branding, and manage client-level AI visibility monitoring.
              </p>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4FD8] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-[#153eb2]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Workspace
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-300">
            <span>{error}</span>
            <button
              onClick={fetchWorkspaces}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-200 transition hover:bg-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Modal for Creating Workspace */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border-color bg-card p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-border-color pb-3">
                <h3 className="text-base font-bold text-white">Create Agency Workspace</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg p-1 text-secondary hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-secondary">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Marketing Group"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border-color/80 bg-slate-950/70 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
                  />
                </div>

                {createError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    {createError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="rounded-xl border border-border-color px-4 py-2 text-xs font-semibold text-secondary hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-[#1B4FD8] px-4 py-2 text-xs font-bold text-white hover:bg-[#153eb2] disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && workspaces.length === 0 && (
          <div className="rounded-3xl border border-border-color/70 bg-card/60 p-8 text-center shadow-lg md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B4FD8]/10 text-[#1B4FD8]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0H9m1 0h1"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">No Agency Workspaces Yet</h2>
            <p className="mx-auto mt-2 max-w-md text-xs text-secondary">
              Agency Workspaces allow agency partners and consultants to manage multi-client portfolios, attach client brands, customize PDF report branding, and deliver white-labeled AI visibility audits.
            </p>

            <form onSubmit={handleCreateWorkspace} className="mx-auto mt-6 max-w-md space-y-3">
              <input
                type="text"
                required
                placeholder="Enter workspace name (e.g. Apex Digital Agency)"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full rounded-xl border border-border-color bg-slate-950/80 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-[#1B4FD8] focus:outline-none"
              />
              {createError && (
                <div className="text-left text-xs text-red-400">{createError}</div>
              )}
              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-[#1B4FD8] py-3 text-xs font-bold text-white hover:bg-[#153eb2] disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create First Workspace'}
              </button>
            </form>
          </div>
        )}

        {/* Workspaces Grid */}
        {workspaces.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/workspaces/${ws.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-color/80 bg-card p-6 shadow-md transition hover:border-[#1B4FD8]/60 hover:bg-card/90"
              >
                <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-[#1B4FD8]/10 blur-xl transition group-hover:bg-[#1B4FD8]/20" />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-[#1B4FD8]/30 bg-[#1B4FD8]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B4FD8]">
                      {ws.plan_tier || 'AGENCY'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Created {formatDate(ws.created_at)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white transition group-hover:text-sky-300">
                    {ws.name}
                  </h3>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border-color/60 pt-4">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-xs font-semibold text-white">
                      {ws.client_count} {ws.client_count === 1 ? 'Client' : 'Clients'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4FD8] transition group-hover:translate-x-1">
                    Manage →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function WorkspacesPage() {
  return (
    <ProtectedRoute>
      <WorkspacesContent />
    </ProtectedRoute>
  );
}
