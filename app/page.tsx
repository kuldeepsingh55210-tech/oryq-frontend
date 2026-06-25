'use client';

import React from 'react';
import ScanForm from '@/components/ScanForm';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#050814] flex flex-col justify-between overflow-x-hidden">
      
      {/* 1. Header (Navbar) */}
      <Navbar />

      {/* Hero Background Glows */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent_50%)]" />
      <div className="absolute top-1/2 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />

      {/* 2. Main Hero Section */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-12 text-center px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Live Coverage Pill & Headline */}
        <div className="space-y-6 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1 text-[11px] font-bold text-blue-400 border border-blue-500/20 shadow-md">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
            LIVE COVERAGE: GEMINI 1.5 & GPT-4O
          </span>
          <h1 className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl md:text-6xl md:leading-16">
            Is AI recommending your brand, or your competitor's?
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            ORYQ scans ChatGPT, Claude, and Gemini in real-time to track your brand visibility score. 
            Identify index listings, citation ranks, and run Ground Truth audits to audit factual hallucinations.
          </p>
        </div>

        {/* Scan Input Form */}
        <div className="w-full flex justify-center">
          <ScanForm />
        </div>

        {/* 3. Precision Visibility section */}
        <div className="w-full space-y-8 pt-8">
          <div className="text-left space-y-1 max-w-md">
            <h2 className="text-xl font-bold text-white">Precision Visibility</h2>
            <p className="text-xs text-secondary">Analyze your footprint across the AI landscape.</p>
          </div>

          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
            
            {/* Card 1: Search Dominance */}
            <div className="group rounded-2xl border border-border-color bg-card p-6 text-left hover:border-slate-700 hover:bg-[#0e1424] transition duration-300 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-bold text-white">Search Dominance</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Track how often your product is recommended in response to category queries like "best enterprise CRM".
                </p>
              </div>
              <div className="mt-6 space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>LLM COVERAGE</span>
                  <span className="text-accent-green">92%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-green rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            {/* Card 2: Citation Reach */}
            <div className="group rounded-2xl border border-border-color bg-card p-6 text-left hover:border-slate-700 hover:bg-[#0e1424] transition duration-300 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-bold text-white">Citation Reach</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Identify the specific data sources and documentation being indexed by AI agents to represent your brand.
                </p>
              </div>
              <div className="mt-6 space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>SOURCE QUALITY</span>
                  <span className="text-accent-blue">High</span>
                </div>
                <div className="flex gap-0.5 w-full">
                  <div className="h-1 flex-1 bg-accent-blue rounded-l-full" />
                  <div className="h-1 flex-1 bg-accent-blue" />
                  <div className="h-1 flex-1 bg-accent-blue/30 rounded-r-full" />
                </div>
              </div>
            </div>

            {/* Card 3: Reputation Audit */}
            <div className="group rounded-2xl border border-border-color bg-card p-6 text-left hover:border-slate-700 hover:bg-[#0e1424] transition duration-300 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-sm font-bold text-white">Reputation Audit</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Monitor tone and sentiment of AI-generated responses. Discover if models are hallucinating negative facts.
                </p>
              </div>
              <div className="mt-6 space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-slate-500">
                  <span>HALLUCINATION RISK</span>
                  <span className="text-accent-red">Low</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-red rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Closing CTA Section */}
        <div className="w-full rounded-2xl border border-border-color bg-card p-8 md:p-12 text-center space-y-6 shadow-xl mt-8">
          <h2 className="text-2xl font-bold text-white">Ready to secure your AI presence?</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Oryq provides a real-time dashboard tracking millions of AI interactions to protect your competitive edge in the new web.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                document.getElementById('brandName')?.focus();
                window.scrollTo({ top: 180, behavior: 'smooth' });
              }}
              className="rounded-xl bg-accent-blue px-6 py-3 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition cursor-pointer"
            >
              Request Demo
            </button>
            <button
              onClick={() => {
                document.getElementById('brandName')?.focus();
                window.scrollTo({ top: 180, behavior: 'smooth' });
              }}
              className="rounded-xl border border-slate-600 px-6 py-3 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              View Samples
            </button>
          </div>
        </div>

      </div>

      {/* 5. Footer */}
      <footer className="border-t border-border-color bg-[#0f1526]/50 py-6 text-center text-xs text-slate-500 select-none">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ORYQ AI. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
