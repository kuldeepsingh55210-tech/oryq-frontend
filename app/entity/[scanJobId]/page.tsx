'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingScreen from '@/components/LoadingScreen';
import { API_BASE_URL } from '@/lib/config';

interface PageProps {
  params: Promise<{ scanJobId: string }>;
}

interface CategoryCount {
  total: number;
  known: number;
}

interface EntityOverviewResponse {
  coverage_score: number;
  total_entities: number;
  known_to_ai: number;
  by_type: Record<string, CategoryCount>;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  is_known: boolean;
  coverage_pct: number;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface EntityGapItem {
  entity_name: string;
  entity_type: string;
  impact_score: number;
  coverage_pct: number;
  recommended_fix: string;
  effort: string;
}

type TabType = 'overview' | 'graph' | 'gaps';

function EntityIntelligenceContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const scanJobId = resolvedParams.scanJobId;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<EntityOverviewResponse | null>(null);
  const [graphData, setGraphData] = useState<GraphResponse>({ nodes: [], edges: [] });
  const [gaps, setGaps] = useState<EntityGapItem[]>([]);
  const [brandId, setBrandId] = useState<string | null>(null);

  // Graph state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Add Entity Form state
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState('product');
  const [isSubmittingEntity, setIsSubmittingEntity] = useState(false);
  const [addEntityError, setAddEntityError] = useState<string | null>(null);
  const [addEntitySuccess, setAddEntitySuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // 1. Fetch scan job details to obtain brand_id
      const scanRes = await fetch(`${API_BASE_URL}/api/v1/scan/${scanJobId}`, { headers });
      if (scanRes.ok) {
        const scanData = await scanRes.json();
        if (scanData.brand_id) {
          setBrandId(scanData.brand_id);
        }
      }

      // 2. Fetch Entity Overview
      const overviewRes = await fetch(`${API_BASE_URL}/api/v1/entity/${scanJobId}/overview`, { headers });
      if (!overviewRes.ok) {
        throw new Error('Failed to load entity overview.');
      }
      const overviewData = await overviewRes.json();
      setOverview(overviewData);

      // 3. Fetch Entity Graph
      const graphRes = await fetch(`${API_BASE_URL}/api/v1/entity/${scanJobId}/graph`, { headers });
      if (graphRes.ok) {
        const gData = await graphRes.json();
        setGraphData(gData || { nodes: [], edges: [] });
      }

      // 4. Fetch Entity Gaps
      const gapsRes = await fetch(`${API_BASE_URL}/api/v1/entity/${scanJobId}/gaps`, { headers });
      if (gapsRes.ok) {
        const gapsData = await gapsRes.json();
        setGaps(gapsData || []);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error loading entity intelligence diagnostics.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && scanJobId) {
      localStorage.setItem('lastScanJobId', scanJobId);
    }
    fetchData();
  }, [scanJobId]);

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddEntityError(null);
    setAddEntitySuccess(null);

    if (!newEntityName.trim()) {
      setAddEntityError('Entity name is required.');
      return;
    }

    if (!brandId) {
      setAddEntityError('Brand ID unresolved. Please refresh the page.');
      return;
    }

    setIsSubmittingEntity(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('oryq_access_token') : null;
      const res = await fetch(`${API_BASE_URL}/api/v1/entity/${brandId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          entity_name: newEntityName.trim(),
          entity_type: newEntityType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to add entity.');
      }

      setAddEntitySuccess(`Entity '${newEntityName}' registered successfully.`);
      setNewEntityName('');
      // Refresh overview, graph, and gaps
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAddEntityError(err.message);
      } else {
        setAddEntityError('An error occurred adding the entity.');
      }
    } finally {
      setIsSubmittingEntity(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Extracting entity knowledge graph & coverage diagnostics..." />;
  }

  return (
    <SidebarLayout activeItem="dashboard">
      <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">V2 Entity Intelligence</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl font-display">
              Brand Entity Coverage & Knowledge Graph
            </h1>
            <p className="mt-1 text-xs text-secondary">
              Track how accurately AI models represent your products, key people, differentiators, and tech stack.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 rounded-xl bg-card border border-border-color p-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === 'graph'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Knowledge Graph
            </button>
            <button
              onClick={() => setActiveTab('gaps')}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === 'gaps'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Gaps ({gaps.length})
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-400">
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 hover:bg-red-500/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-purple-500/30 bg-card p-6 shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl pointer-events-none" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Entity Coverage Score</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white font-mono">{overview.coverage_score}%</span>
                  <span className="text-xs font-semibold text-slate-400">known to AI</span>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, overview.coverage_score))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tracked Entities</span>
                <div className="mt-2 text-4xl font-extrabold text-white font-mono">{overview.total_entities}</div>
                <span className="mt-1 block text-xs text-slate-500">Across 6 core entity types</span>
              </div>

              <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Mention Frequency</span>
                <div className="mt-2 text-4xl font-extrabold text-green-400 font-mono">
                  {overview.known_to_ai} <span className="text-lg text-slate-500 font-normal">/ {overview.total_entities}</span>
                </div>
                <span className="mt-1 block text-xs text-slate-500">Entities present in LLM outputs</span>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-2xl border border-border-color bg-card p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-border-color pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Entity Coverage by Category</h3>
                  <p className="text-xs text-secondary mt-0.5">Distribution of brand knowledge across entity classifications</p>
                </div>
                <span className="text-xs font-mono text-slate-500">Updated from live scan</span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(overview.by_type).map(([typeKey, data]) => {
                  const pct = data.total > 0 ? Math.round((data.known / data.total) * 100) : 0;
                  return (
                    <div key={typeKey} className="rounded-xl border border-border-color/60 bg-slate-900/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                          {typeKey}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">
                            {data.known} / {data.total} known
                          </span>
                          <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/20 font-mono">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Information Banner */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-300">
                  Entity extraction executes automatically during every scan run. Use the <strong>Knowledge Graph</strong> tab to register custom brand entities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KNOWLEDGE GRAPH TAB */}
        {activeTab === 'graph' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* SVG Graph View */}
            <div className="lg:col-span-8 rounded-2xl border border-border-color bg-card p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-border-color pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Interactive Knowledge Graph</h3>
                  <p className="text-xs text-secondary mt-0.5">Click any node to inspect relationship details</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Known to AI
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Unknown
                  </span>
                </div>
              </div>

              {/* Render SVG Graph */}
              {graphData.nodes.length === 0 ? (
                <div className="flex h-80 items-center justify-center text-xs text-slate-500">
                  No entity nodes found. Add a custom entity on the right to build your knowledge graph.
                </div>
              ) : (
                <div className="relative h-96 w-full rounded-xl bg-slate-950/80 border border-slate-900 overflow-hidden flex items-center justify-center p-4">
                  <svg className="h-full w-full" viewBox="0 0 600 400">
                    <defs>
                      <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>

                    {/* Edge Lines */}
                    {graphData.edges.map((edge, idx) => {
                      const sourceIdx = graphData.nodes.findIndex((n) => n.id === edge.source);
                      const targetIdx = graphData.nodes.findIndex((n) => n.id === edge.target);

                      if (sourceIdx === -1 || targetIdx === -1) return null;

                      const totalNodes = graphData.nodes.length;
                      const cx = 300;
                      const cy = 200;
                      const radius = 130;

                      const sx = cx + radius * Math.cos((2 * Math.PI * sourceIdx) / totalNodes);
                      const sy = cy + radius * Math.sin((2 * Math.PI * sourceIdx) / totalNodes);

                      const tx = cx + radius * Math.cos((2 * Math.PI * targetIdx) / totalNodes);
                      const ty = cy + radius * Math.sin((2 * Math.PI * targetIdx) / totalNodes);

                      return (
                        <line
                          key={`edge-${idx}`}
                          x1={sx}
                          y1={sy}
                          x2={tx}
                          y2={ty}
                          stroke="url(#edgeGrad)"
                          strokeWidth={Math.max(1, edge.strength * 3)}
                          strokeDasharray={edge.strength < 0.4 ? '4,4' : undefined}
                        />
                      );
                    })}

                    {/* Node Circles */}
                    {graphData.nodes.map((node, idx) => {
                      const totalNodes = graphData.nodes.length;
                      const cx = 300;
                      const cy = 200;
                      const radius = 130;

                      const nx = cx + radius * Math.cos((2 * Math.PI * idx) / totalNodes);
                      const ny = cy + radius * Math.sin((2 * Math.PI * idx) / totalNodes);

                      const isSelected = selectedNode?.id === node.id;

                      return (
                        <g
                          key={node.id}
                          className="cursor-pointer transition hover:opacity-80"
                          onClick={() => setSelectedNode(node)}
                        >
                          <circle
                            cx={nx}
                            cy={ny}
                            r={isSelected ? 22 : 18}
                            fill={node.is_known ? '#7C3AED' : '#334155'}
                            stroke={isSelected ? '#FFFFFF' : node.is_known ? '#A78BFA' : '#64748B'}
                            strokeWidth={isSelected ? 3 : 1.5}
                          />
                          <text
                            x={nx}
                            y={ny + 32}
                            textAnchor="middle"
                            fill="#E2E8F0"
                            fontSize="10"
                            fontWeight="600"
                            className="pointer-events-none select-none font-sans"
                          >
                            {node.name.length > 14 ? `${node.name.slice(0, 12)}...` : node.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {/* Selected Node Details Panel */}
              {selectedNode && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{selectedNode.name}</span>
                    <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-bold text-purple-300 uppercase tracking-wider border border-purple-500/30">
                      {selectedNode.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
                    <span>Status: <strong className={selectedNode.is_known ? 'text-green-400' : 'text-slate-400'}>{selectedNode.is_known ? 'Known to AI' : 'Unknown'}</strong></span>
                    <span>Coverage: <strong>{selectedNode.coverage_pct}%</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Add Entity Form */}
            <div className="lg:col-span-4 rounded-2xl border border-border-color bg-card p-6 shadow-md space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white">Add Missing Entity</h3>
                <p className="text-xs text-secondary mt-1">Register a product, key person, or feature for AI tracking</p>
              </div>

              {addEntityError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-400">
                  {addEntityError}
                </div>
              )}

              {addEntitySuccess && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-xs font-medium text-green-400">
                  {addEntitySuccess}
                </div>
              )}

              <form onSubmit={handleAddEntity} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    placeholder="e.g. Enterprise API Suite"
                    className="mt-2 w-full rounded-xl border border-border-color bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Entity Type
                  </label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-border-color bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="product">Product</option>
                    <option value="person">Person / Executive</option>
                    <option value="differentiator">Differentiator</option>
                    <option value="technology">Technology / Tech Stack</option>
                    <option value="award">Award / Certification</option>
                    <option value="location">Location / HQ</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEntity}
                  className="w-full rounded-xl bg-accent-blue py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmittingEntity ? 'Registering...' : 'Add Entity to Graph'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* GAPS TAB */}
        {activeTab === 'gaps' && (
          <div className="rounded-2xl border border-border-color bg-card shadow-md overflow-hidden">
            <div className="border-b border-border-color px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Entity Knowledge Gaps</h3>
                <p className="text-xs text-secondary mt-0.5">Entities missing or underrepresented in AI model outputs</p>
              </div>
              <span className="text-xs font-mono text-slate-400">{gaps.length} gaps identified</span>
            </div>

            <div className="divide-y divide-border-color">
              {gaps.map((gap, idx) => (
                <div key={idx} className="p-6 transition hover:bg-slate-900/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{gap.entity_name}</span>
                      <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-400 uppercase tracking-wider border border-purple-500/20">
                        {gap.entity_type}
                      </span>
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20 font-mono">
                        Effort: {gap.effort}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Impact Score</span>
                        <span className="text-sm font-extrabold text-red-400 font-mono">{gap.impact_score}/100</span>
                      </div>
                      <Link
                        href={`/optimization?entity=${encodeURIComponent(gap.entity_name)}`}
                        className="rounded-xl bg-accent-blue px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-blue-600"
                      >
                        Fix this →
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                    <strong className="text-purple-400">Recommended Action:</strong> {gap.recommended_fix}
                  </p>
                </div>
              ))}

              {gaps.length === 0 && (
                <div className="p-8 text-center text-xs text-secondary">
                  No entity knowledge gaps detected! All tracked brand entities are recognized by AI models.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}

export default function EntityPage(props: PageProps) {
  return (
    <ProtectedRoute>
      <EntityIntelligenceContent {...props} />
    </ProtectedRoute>
  );
}
