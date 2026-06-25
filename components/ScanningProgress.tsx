'use client';

import React, { useEffect, useState } from 'react';

export type ScanType = 'initial' | 'competitor' | 'hallucination';

interface Step {
  name: string;
  action: string;
}

interface ScanningProgressProps {
  brandName: string;
  scanType: ScanType;
  onFinishedSim?: () => void;
}

export default function ScanningProgress({ brandName, scanType, onFinishedSim }: ScanningProgressProps) {
  const [progress, setProgress] = useState(0);

  // Define steps and settings based on scan type
  let title = 'ACTIVE INTELLIGENCE SESSION';
  let subtitle = `Scanning AI Ecosystem for ${brandName}...`;
  let infoText = '';
  let steps: Step[] = [];
  let duration = 8000; // default initial scan duration in ms

  if (scanType === 'initial') {
    steps = [
      { name: 'OpenAI', action: 'Querying ChatGPT (OpenAI)...' },
      { name: 'Anthropic', action: 'Indexing Claude (Anthropic)...' },
      { name: 'Google', action: 'Processing Gemini (Google)...' },
    ];
    infoText = 'High precision scanning protocol initialized. System is currently mapping semantic overlaps across AI large language model parameters to identify potential enterprise vulnerabilities.';
    duration = 10000;
  } else if (scanType === 'competitor') {
    title = 'COMPETITIVE BENCHMARK RUNNING';
    subtitle = `Mapping market positioning against competitors for ${brandName}...`;
    steps = [
      { name: 'Keywords', action: 'Analyzing category keywords...' },
      { name: 'OpenAI SOV', action: 'Evaluating ChatGPT mentions...' },
      { name: 'Anthropic SOV', action: 'Querying Claude response patterns...' },
      { name: 'Google SOV', action: 'Measuring Gemini citations...' },
    ];
    infoText = 'Executing multi-model comparison sequence. Correlating market share of voice indices and semantic proximity vectors to gauge competitor positioning.';
    duration = 25000;
  } else if (scanType === 'hallucination') {
    title = 'FACT AUDIT PROCESS ACTIVE';
    subtitle = `Verifying statement integrity for ${brandName}...`;
    steps = [
      { name: 'Ingestion', action: 'Ingesting fact statements...' },
      { name: 'Alignment', action: 'Checking OpenAI output logs...' },
      { name: 'Verification', action: 'Running fact verification algorithms...' },
    ];
    infoText = 'Auditing hallucination parameters. Querying LLM weights using standard fact templates to detect information drift and erroneous attributes.';
    duration = 15000;
  }

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(98, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        if (onFinishedSim) onFinishedSim();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onFinishedSim]);

  // Determine the status of each step based on the overall percentage
  const getStepStatus = (index: number) => {
    const totalSteps = steps.length;
    const stepRange = 100 / totalSteps;
    const stepThreshold = (index + 1) * stepRange;
    const prevThreshold = index * stepRange;

    if (progress >= stepThreshold - 5) {
      return 'completed';
    } else if (progress >= prevThreshold) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  // SVG Progress circle calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full rounded-2xl border border-border-color bg-card p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl animate-fade-in">
      
      {/* Left Column: Progress Dial Circle */}
      <div className="relative flex h-40 w-40 items-center justify-center shrink-0">
        <svg className="absolute h-full w-full rotate-270 transform">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-border-color fill-transparent"
            strokeWidth="8"
          />
        </svg>

        <svg className="absolute h-full w-full rotate-270 transform">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="fill-transparent stroke-accent-blue transition-all duration-150 ease-out"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Progress Text */}
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-white tracking-tight">{progress}%</span>
          <span className="text-[8px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">Scanning</span>
        </div>
      </div>

      {/* Right Column: Step Lists & info */}
      <div className="flex-1 space-y-6 w-full">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] font-bold text-accent-blue tracking-widest uppercase">
            {title}
          </span>
          <h3 className="text-base font-bold text-white">{subtitle}</h3>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5 bg-card-light rounded-xl p-5 border border-border-color">
          {steps.map((step, idx) => {
            const status = getStepStatus(idx);
            return (
              <div key={idx} className="flex items-center justify-between gap-4 text-xs font-semibold">
                
                {/* Status Indicator & Action */}
                <div className="flex items-center gap-3">
                  {status === 'completed' && (
                    <span className="h-5 w-5 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-accent-green shrink-0">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  {status === 'active' && (
                    <span className="h-5 w-5 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center shrink-0">
                      <span className="h-2 w-2 rounded-full bg-accent-blue animate-ping" />
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    </span>
                  )}
                  <span className={status === 'completed' ? 'text-slate-300' : status === 'active' ? 'text-white' : 'text-slate-500'}>
                    {step.action}
                  </span>
                </div>

                {/* Status Badge */}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  status === 'completed' ? 'text-accent-green' : status === 'active' ? 'text-accent-blue' : 'text-slate-500'
                }`}>
                  {status === 'completed' ? 'Completed' : status === 'active' ? 'Active' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Technical Logs Info box */}
        <p className="text-[10px] text-slate-400 italic leading-relaxed pl-1">
          {infoText}
        </p>
      </div>

    </div>
  );
}
