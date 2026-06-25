'use client';

import React, { useState } from 'react';
import { RecommendationItem } from '@/lib/api';

interface ActionPlanTabProps {
  recommendations: RecommendationItem[];
}

function SparkleIcon() {
  return (
    <svg className="h-4 w-4 text-accent-blue" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 6.6 6.6 2.4-6.6 2.4-2.4 6.6-2.4-6.6-6.6-2.4 6.6-2.4z" />
    </svg>
  );
}

function RecommendationCard({ rec }: { rec: RecommendationItem }) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const isHighImpact = rec.impact.toLowerCase().includes('high');

  return (
    <div className="rounded-2xl border border-border-color bg-card p-6 space-y-5 hover:border-slate-700 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] transition duration-300 flex flex-col justify-between shadow-md">
      <div className="space-y-4">
        {/* Top badges and metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {rec.category.replace('_', ' ')}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-slate-800/80 px-2.5 py-1 text-[9px] font-bold text-slate-300 border border-slate-700/50">
              Effort: {rec.effort}
            </span>
            <span className={`rounded px-2.5 py-1 text-[9px] font-bold border ${
              isHighImpact 
                ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/30' 
                : 'bg-accent-green/15 text-accent-green border-accent-green/30'
            }`}>
              {rec.impact}
            </span>
          </div>
        </div>

        {/* Title and main description */}
        <div className="space-y-2">
          <h4 className="text-base font-bold text-white leading-snug">{rec.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed bg-card-light/40 p-4 rounded-xl border border-border-color/60 italic">
            "{rec.action}"
          </p>
        </div>

        {/* Generated Ready-to-Use Content Section */}
        {rec.generated_content && (
          <div className="space-y-4 border-t border-border-color/60 pt-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <SparkleIcon />
              <span>Ready-to-Use Content</span>
            </div>

            {/* Generated text copy block */}
            <div className="relative group rounded-xl border border-border-color bg-card-light/40 p-4 space-y-2 transition hover:bg-card-light/60">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {rec.generated_content.content_type || 'Tailored Content'}
                </span>
                <button
                  onClick={() => handleCopyText(rec.generated_content!.generated_text)}
                  className="rounded-lg border border-slate-700 bg-card hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  {copiedText ? (
                    <>
                      <svg className="h-3.5 w-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-accent-green font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line select-all">
                {rec.generated_content.generated_text}
              </p>
            </div>

            {/* Generated code copy block */}
            {rec.generated_content.generated_code && (
              <div className="relative group rounded-xl border border-border-color bg-slate-950/80 p-4 space-y-2 transition hover:bg-slate-950">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Structured Schema JSON-LD
                  </span>
                  <button
                    onClick={() => handleCopyCode(rec.generated_content!.generated_code!)}
                    className="rounded-lg border border-slate-800 bg-card hover:bg-slate-900 text-slate-300 hover:text-white px-2.5 py-1 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    {copiedCode ? (
                      <>
                        <svg className="h-3.5 w-3.5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-accent-green font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[11px] text-accent-blue font-mono overflow-x-auto whitespace-pre-wrap select-all leading-normal bg-black/35 p-3 rounded-lg border border-border-color/30">
                  <code>{rec.generated_content.generated_code}</code>
                </pre>
              </div>
            )}

            {/* Deployment instructions */}
            <div className="bg-card-light/25 border border-border-color/30 rounded-xl p-4 space-y-1">
              <span className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Deployment Instructions
              </span>
              <p className="text-xs text-slate-400 italic leading-relaxed">
                {rec.generated_content.instructions}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] font-bold text-accent-blue mt-4 pt-4 border-t border-border-color/50">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-ping" />
        <span>RECOMMENDED ACTION PLAN</span>
      </div>
    </div>
  );
}

export default function ActionPlanTab({ recommendations }: ActionPlanTabProps) {
  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b border-border-color pb-4">
        <h3 className="text-lg font-bold text-white">Action Plan & Recommendations</h3>
        <p className="text-xs text-secondary mt-1">
          Targeted optimization tasks designed to correct hallucinations and bolster LLM citation coverage.
        </p>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border-color bg-card p-8 text-center space-y-2">
          <span className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </span>
          <p className="text-sm font-bold text-slate-300">No Recommendations Available</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Action items are generated automatically based on detected hallucinations and comparison rankings. Run a competitor comparison or fact verification check first.
          </p>
        </div>
      )}
    </div>
  );
}
