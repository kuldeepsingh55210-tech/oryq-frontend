'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Sidebar, { SidebarItem } from './Sidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeItem?: SidebarItem;
  onTabChange?: (tab: string) => void;
}

function SidebarWithActiveState({ onItemClick }: { onItemClick: (item: SidebarItem) => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  let computedActiveItem: SidebarItem = 'dashboard';

  if (pathname.includes('/history')) {
    computedActiveItem = 'history';
  } else if (pathname.includes('/workspaces')) {
    computedActiveItem = 'workspaces';
  } else if (pathname.includes('/sentiment')) {
    computedActiveItem = 'sentiment';
  } else if (pathname.includes('/entity')) {
    computedActiveItem = 'entity';
  } else if (pathname.includes('/revenue')) {
    computedActiveItem = 'revenue';
  } else if (pathname.includes('/benchmark')) {
    computedActiveItem = 'benchmark';
  } else if (pathname.includes('/alerts')) {
    computedActiveItem = 'alerts';
  } else if (pathname.includes('/scan/')) {
    const tab = searchParams.get('tab');
    if (tab === 'competitors') {
      computedActiveItem = 'competitors';
    } else if (tab === 'hallucinations') {
      computedActiveItem = 'hallucinations';
    } else {
      computedActiveItem = 'dashboard';
    }
  }

  return <Sidebar activeItem={computedActiveItem} onItemClick={onItemClick} />;
}

export default function SidebarLayout({ children, activeItem, onTabChange }: SidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Unified click handler for sidebar navigation items
  const handleItemClick = (item: SidebarItem) => {
    if (item === 'settings') {
      setShowSettingsModal(true);
      return;
    }

    if (item === 'history') {
      router.push('/history');
      return;
    }

    if (item === 'workspaces') {
      router.push('/workspaces');
      return;
    }

    // Retrieve last scan job ID or brand ID from localStorage
    const lastScanId = typeof window !== 'undefined' ? localStorage.getItem('lastScanJobId') : null;
    const lastBrandId = typeof window !== 'undefined' ? (localStorage.getItem('lastBrandId') || lastScanId) : null;

    if (item === 'dashboard') {
      if (onTabChange) {
        onTabChange('overview');
      } else if (lastScanId) {
        router.push(`/scan/${lastScanId}?tab=overview`);
      } else {
        router.push('/');
      }
      return;
    }

    if (item === 'competitors') {
      if (onTabChange) {
        onTabChange('competitors');
      } else if (lastScanId) {
        router.push(`/scan/${lastScanId}?tab=competitors`);
      } else {
        router.push('/');
      }
      return;
    }

    if (item === 'hallucinations') {
      if (onTabChange) {
        onTabChange('hallucinations');
      } else if (lastScanId) {
        router.push(`/scan/${lastScanId}?tab=hallucinations`);
      } else {
        router.push('/');
      }
      return;
    }

    if (item === 'sentiment') {
      if (lastScanId) {
        router.push(`/sentiment/${lastScanId}`);
      } else {
        router.push('/history');
      }
      return;
    }

    if (item === 'entity') {
      if (lastScanId) {
        router.push(`/entity/${lastScanId}`);
      } else {
        router.push('/history');
      }
      return;
    }

    if (item === 'revenue') {
      if (lastBrandId) {
        router.push(`/revenue/${lastBrandId}`);
      } else {
        router.push('/history');
      }
      return;
    }

    if (item === 'benchmark') {
      if (lastBrandId) {
        router.push(`/benchmark/${lastBrandId}`);
      } else {
        router.push('/history');
      }
      return;
    }

    if (item === 'alerts') {
      if (lastBrandId) {
        router.push(`/alerts/${lastBrandId}`);
      } else {
        router.push('/history');
      }
      return;
    }
  };

  return (
    <div className="flex h-screen bg-[#050814] overflow-hidden text-slate-100 font-sans">
      
      {/* 1. DESKTOP SIDEBAR - PERSISTENT */}
      <div className="hidden lg:flex h-full shrink-0">
        <Suspense fallback={<div className="w-64 bg-card border-r border-border-color h-full" />}>
          <SidebarWithActiveState onItemClick={handleItemClick} />
        </Suspense>
      </div>

      {/* 2. MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/75 backdrop-blur-xs">
          <div className="relative flex flex-col h-full bg-[#0f1526] w-64 shadow-2xl animate-slide-in">
            {/* Close Button Inside Drawer */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Suspense fallback={<div className="w-64 bg-card h-full" />}>
              <SidebarWithActiveState onItemClick={handleItemClick} />
            </Suspense>
          </div>
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* 3. MAIN CONTAINER AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-16 border-b border-border-color bg-[#0f1526] flex items-center justify-between px-6 shrink-0 select-none">
          
          {/* Left search & hamburger */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            {/* Hamburger Button (visible on mobile only) */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition"
              aria-label="Toggle Sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Cosmetic Search input */}
            <div className="relative w-full hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search datasets, crawls or insights..."
                readOnly
                className="w-full bg-[#1a2035] border border-border-color rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 placeholder-slate-500 outline-hidden select-none cursor-default"
              />
            </div>
          </div>

          {/* Right actions & user profile */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Help / Info Icon */}
            <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Notification Bell with indicator dot */}
            <button className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-amber animate-pulse" />
            </button>

            {/* User profile avatar badge */}
            <div className="flex items-center gap-3 border-l border-border-color pl-4">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-white">Analyst Alpha</span>
                <span className="text-[9px] font-bold text-accent-blue tracking-wider uppercase">Pro Tier</span>
              </div>
              <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-tr from-accent-blue to-indigo-500 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
                AA
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-[#050814]">
          {children}
        </main>
      </div>

      {/* Settings Modal (Cosmetic) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-border-color bg-[#0f1526] p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="h-5 w-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <span>Platform Settings</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-[#1a2035] p-3 rounded-lg border border-border-color">
              This settings panel is cosmetic. In a production environment, this is where API keys, custom webhooks, crawler schedules, and Resend credentials would be configured.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-xl bg-accent-blue hover:bg-blue-500 text-white px-5 py-2 text-xs font-semibold shadow-md transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
