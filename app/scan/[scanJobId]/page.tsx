'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { ShareableScoreCard } from '@/components/ShareableScoreCard';
import ShareModal from '@/components/ShareModal';
import SidebarLayout from '@/components/SidebarLayout';
import OverviewTab from '@/components/tabs/OverviewTab';
import CompetitorTab from '@/components/tabs/CompetitorTab';
import HallucinationTab from '@/components/tabs/HallucinationTab';
import ActionPlanTab from '@/components/tabs/ActionPlanTab';
import {
  getScanStatus,
  compareCompetitors,
  checkHallucinations,
  ScanStatusResponse,
  CompetitorResponse,
  HallucinationItem,
  API_BASE_URL,
  emailScanReport,
  getRecommendations,
  RecommendationItem,
  getBrandHistory,
  BrandHistoryItem,
} from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';

interface PageProps {
  params: Promise<{ scanJobId: string }>;
}

type TabType = 'overview' | 'competitors' | 'hallucinations' | 'action_plan';

function ScanResultsContent({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const scanJobId = resolvedParams.scanJobId;

  // Global Page States
  const [statusData, setStatusData] = useState<ScanStatusResponse | null>(null);
  const [brandName, setBrandName] = useState('Your Brand');
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Fetching AI visibility diagnostics...');
  const [error, setError] = useState<string | null>(null);
  const [brandHistory, setBrandHistory] = useState<BrandHistoryItem[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Competitor Scan States
  const [comp1, setComp1] = useState('');
  const [comp2, setComp2] = useState('');
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  const [competitorData, setCompetitorData] = useState<CompetitorResponse | null>(null);

  // Hallucination Scan States
  const [pricingFact, setPricingFact] = useState('');
  const [foundedFact, setFoundedFact] = useState('');
  const [categoryFact, setCategoryFact] = useState('');
  const [halLoading, setHalLoading] = useState(false);
  const [halError, setHalError] = useState<string | null>(null);
  const [hallucinations, setHallucinations] = useState<HallucinationItem[] | null>(null);

  // Collapsible detailed logs state
  const [showLogs, setShowLogs] = useState(false);

  // PDF download loading state
  const [pdfLoading, setPdfLoading] = useState(false);

  // Shareable Card states
  const scoreCardRef = useRef<HTMLDivElement>(null);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Email form states
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Action Recommendations states
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  // PDF Export Trigger
  const handleDownloadPdf = () => {
    setPdfLoading(true);
    window.open(`${API_BASE_URL}/api/v1/scan/${scanJobId}/report.pdf`, '_blank');
    setTimeout(() => {
      setPdfLoading(false);
    }, 2000);
  };

  // Image Share Trigger
  const handleShareScore = async () => {
    if (!scoreCardRef.current) return;
    try {
      setIsGeneratingCard(true);
      const dataUrl = await toPng(scoreCardRef.current, {
        width: 1200,
        height: 630,
        style: {
          position: 'static',
          transform: 'none',
        }
      });
      setShareImage(dataUrl);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error('Failed to generate share image:', err);
      alert('Failed to generate share image. Please try downloading instead or retry.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Email dispatch handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const emailClean = emailInput.trim();
    if (!emailClean) {
      setEmailError('Please enter an email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailClean)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    try {
      setEmailLoading(true);
      const res = await emailScanReport(scanJobId, emailClean);
      if (res.success) {
        setEmailSuccess(`Report sent to ${emailClean}! Check your inbox.`);
        setEmailInput('');
      } else {
        setEmailError(res.message || 'Failed to send report email.');
      }
    } catch (err: any) {
      console.error(err);
      setEmailError(err?.message || 'Failed to send report email.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Helper to extract brand name from prompt text
  const extractBrandName = (prompts: string[]): string => {
    for (const prompt of prompts) {
      const match = prompt.match(/Is\s+(.+?)\s+worth\s+the\s+price/i);
      if (match && match[1]) return match[1].trim();

      const match2 = prompt.match(/Compare\s+(.+?)\s+vs\s+competitors/i);
      if (match2 && match2[1]) return match2[1].trim();

      const match3 = prompt.match(/How\s+does\s+(.+?)\s+stack\s+up/i);
      if (match3 && match3[1]) return match3[1].trim();
    }
    return 'Your Brand';
  };

  // Load Initial scan data on mount
  useEffect(() => {
    if (!scanJobId) return;

    // Cache current scan job ID for sidebar navigation return links
    localStorage.setItem('lastScanJobId', scanJobId);

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setLoadingMessage('Fetching AI visibility diagnostics...');
        setError(null);
        const data = await getScanStatus(scanJobId);
        setStatusData(data);
        if (data.brand_id && typeof window !== 'undefined') {
          localStorage.setItem('lastBrandId', data.brand_id);
        }

        // Extract brand name from the results prompts if available
        let extractedName = 'Your Brand';
        if (data.results && data.results.length > 0) {
          const prompts = data.results.map((r) => r.prompt_text);
          extractedName = extractBrandName(prompts);
          setBrandName(extractedName);
        }

        // Fetch recommendations
        try {
          setLoadingMessage('Generating personalized fix content...');
          const recs = await getRecommendations(scanJobId);
          setRecommendations(recs);
        } catch (err) {
          console.error("Failed to fetch recommendations:", err);
        }

        // Fetch brand history
        try {
          const hist = await getBrandHistory(extractedName);
          setBrandHistory(hist);
        } catch (err) {
          console.error("Failed to fetch history:", err);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to fetch scan results.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [scanJobId]);

  // Synchronize Tab state from URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['overview', 'competitors', 'hallucinations', 'action_plan'].includes(tabParam)) {
        setActiveTab(tabParam as TabType);
      }
    }
  }, []);

  // Update tab state & modify URL cosmetically
  const changeTab = (tab: string) => {
    if (['overview', 'competitors', 'hallucinations', 'action_plan'].includes(tab)) {
      setActiveTab(tab as TabType);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  };

  // Competitor form submissions
  const handleCompetitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompError(null);
    setCompetitorData(null);

    const competitors = [comp1.trim(), comp2.trim()].filter(Boolean);
    if (competitors.length === 0) {
      setCompError('Please enter at least one competitor name.');
      return;
    }

    try {
      setCompLoading(true);
      const res = await compareCompetitors(scanJobId, competitors);
      setCompetitorData(res);
    } catch (err: any) {
      console.error(err);
      setCompError(err?.message || 'Competitor scan failed.');
    } finally {
      setCompLoading(false);
    }
  };

  // Hallucination audit submissions
  const handleHallucinationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHalError(null);
    setHallucinations(null);

    if (!pricingFact.trim() && !foundedFact.trim() && !categoryFact.trim()) {
      setHalError('Please provide at least one fact to verify.');
      return;
    }

    const facts: Record<string, string> = {};
    if (pricingFact.trim()) facts['pricing'] = pricingFact.trim();
    if (foundedFact.trim()) facts['founded'] = foundedFact.trim();
    if (categoryFact.trim()) facts['category'] = categoryFact.trim();

    try {
      setHalLoading(true);
      const res = await checkHallucinations(scanJobId, facts);
      setHallucinations(res);
    } catch (err: any) {
      console.error(err);
      setHalError(err?.message || 'Hallucination check failed.');
    } finally {
      setHalLoading(false);
    }
  };

  // Translate tab name to SidebarItem category
  const getActiveSidebarItem = () => {
    if (activeTab === 'competitors') return 'competitors';
    if (activeTab === 'hallucinations') return 'hallucinations';
    return 'dashboard';
  };

  if (loading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center min-h-screen bg-[#050814]">
        <div className="max-w-md space-y-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-slate-100 shadow-xl">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold">Failed to Load Scan</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const results = statusData?.results || [];
  const totalCount = results.length;
  const mentionCount = results.filter((r) => r.brand_mentioned).length;
  const score = statusData?.score ?? 0;

  return (
    <SidebarLayout activeItem={getActiveSidebarItem()} onTabChange={changeTab}>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* Top Breadcrumb/Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-accent-blue tracking-widest uppercase">Intelligence scan</span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-500">Job: <span className="font-mono">{scanJobId}</span></span>
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Scan Dashboard: <span className="text-accent-blue font-extrabold">{brandName}</span>
            </h1>
            <div className="flex items-center gap-x-2 mt-1">
              <Link
                href={`/history?brand=${encodeURIComponent(brandName)}`}
                className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                View score history for {brandName}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-card border border-border-color px-3.5 py-2 text-xs font-semibold text-secondary">
              Total Cost: <span className="font-bold text-white">${statusData?.total_cost_usd.toFixed(4)}</span>
            </span>
            <span className="rounded-lg bg-card border border-border-color px-3.5 py-2 text-xs font-semibold text-secondary flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent-green shrink-0 animate-ping" />
              Engine Status: <span className="font-bold text-accent-green uppercase">Active</span>
            </span>
            
            {/* Export PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-card hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold transition cursor-pointer hover:border-slate-400 disabled:opacity-50"
            >
              {pdfLoading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export PDF</span>
                </>
              )}
            </button>

            {/* Share Insights Button */}
            <button
              onClick={handleShareScore}
              disabled={isGeneratingCard}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-accent-blue hover:bg-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-md transition cursor-pointer disabled:opacity-50"
            >
              {isGeneratingCard ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>Share Insights</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TAB BAR NAVIGATION */}
        <div className="border-b border-border-color">
          <div className="flex gap-6 overflow-x-auto select-none">
            <button
              onClick={() => changeTab('overview')}
              className={`py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-accent-blue text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => changeTab('competitors')}
              className={`py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'competitors'
                  ? 'border-accent-blue text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Competitor Intelligence
            </button>
            <button
              onClick={() => changeTab('hallucinations')}
              className={`py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'hallucinations'
                  ? 'border-accent-blue text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Hallucination Tracker
            </button>
            <button
              onClick={() => changeTab('action_plan')}
              className={`py-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'action_plan'
                  ? 'border-accent-blue text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Action Plan
            </button>
          </div>
        </div>

        {/* TAB CONTENT swaps via activeTab state */}
        <div className="min-h-[40vh]">
          {activeTab === 'overview' && (
            <OverviewTab
              score={score}
              mentionCount={mentionCount}
              totalCount={totalCount}
              brandName={brandName}
              brandHistory={brandHistory}
              emailInput={emailInput}
              setEmailInput={setEmailInput}
              emailLoading={emailLoading}
              emailError={emailError}
              emailSuccess={emailSuccess}
              handleEmailSubmit={handleEmailSubmit}
              hallucinations={hallucinations}
              competitorData={competitorData}
              headlineEvidence={statusData?.headline_evidence}
              onTabChange={changeTab}
              trend={statusData?.trend}
            />
          )}

          {activeTab === 'competitors' && (
            <CompetitorTab
              comp1={comp1}
              setComp1={setComp1}
              comp2={comp2}
              setComp2={setComp2}
              compLoading={compLoading}
              compError={compError}
              competitorData={competitorData}
              handleCompetitorSubmit={handleCompetitorSubmit}
              brandName={brandName}
              score={score}
            />
          )}

          {activeTab === 'hallucinations' && (
            <HallucinationTab
              pricingFact={pricingFact}
              setPricingFact={setPricingFact}
              foundedFact={foundedFact}
              setFoundedFact={setFoundedFact}
              categoryFact={categoryFact}
              setCategoryFact={setCategoryFact}
              halLoading={halLoading}
              halError={halError}
              hallucinations={hallucinations}
              handleHallucinationSubmit={handleHallucinationSubmit}
              brandName={brandName}
            />
          )}

          {activeTab === 'action_plan' && (
            <ActionPlanTab recommendations={recommendations} />
          )}
        </div>

        {/* DETAILED RESULTS LIST BREAKDOWN (Common to bottom of dashboard) */}
        <section id="detailed-logs-section" className="rounded-2xl border border-border-color bg-card overflow-hidden shadow-md">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex w-full items-center justify-between px-6 py-5 text-left font-bold text-white hover:bg-card-light transition duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Detailed AI Query Log ({results.length} queries evaluated)</span>
            </div>
            <svg
              className={`h-5 w-5 text-secondary transform transition-transform duration-200 ${showLogs ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLogs && (
            <div className="border-t border-border-color bg-card-light p-6 divide-y divide-border-color max-h-[500px] overflow-y-auto space-y-4">
              {results.map((res, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-card px-2 py-0.5 text-xs font-bold text-slate-200 uppercase tracking-widest border border-border-color">
                        {res.provider}
                      </span>
                      <span className="text-xs font-semibold text-secondary">
                        Latency: {res.latency_ms}ms
                      </span>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest ${
                      res.brand_mentioned
                        ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                        : 'bg-card border border-border-color text-tertiary'
                    }`}>
                      {res.brand_mentioned ? 'Mentioned' : 'Not Mentioned'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-secondary uppercase tracking-wider">
                      Prompt Text
                    </span>
                    <p className="text-sm font-semibold text-white leading-snug">
                      {res.prompt_text}
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded-lg border border-border-color">
                    <span className="block text-xs font-bold text-secondary uppercase tracking-widest mb-1">
                      Response Preview
                    </span>
                    <p className="text-xs text-slate-200 italic leading-relaxed">
                      "{res.response_snippet || 'No snippet content returned.'}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Off-screen container for rendering score card image */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
          <ShareableScoreCard
            ref={scoreCardRef}
            brandName={brandName}
            score={score}
            mentioned={mentionCount}
            total={totalCount}
            statusLabel={
              score >= 70 ? 'High Visibility' : score >= 40 ? 'Moderate Visibility' : 'Low Visibility'
            }
          />
        </div>

        {/* Share Modal popup */}
        {shareImage && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            imageSrc={shareImage}
            brandName={brandName}
            score={score}
            shareText={`My brand's AI Visibility Score is ${score}/100 on ORYQ 🎯 Curious how visible YOUR brand is to ChatGPT, Claude, and Gemini? Free scan: oryq.ai #AIVisibility #GEO`}
          />
        )}
      </div>
    </SidebarLayout>
  );
}

import ProtectedRoute from '@/components/ProtectedRoute';

export default function ScanResultsPage(props: PageProps) {
  return (
    <ProtectedRoute>
      <ScanResultsContent {...props} />
    </ProtectedRoute>
  );
}

