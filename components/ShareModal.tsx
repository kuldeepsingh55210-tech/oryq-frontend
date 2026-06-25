'use client';

import React, { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  brandName: string;
  score: number;
  shareText: string;
}

export default function ShareModal({ isOpen, onClose, imageSrc, brandName, score, shareText }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `oryq-score-${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = imageSrc;
    link.click();
  };

  const handleLinkedInShare = () => {
    // Generate pre-filled LinkedIn post text
    const text = shareText;
    const url = window.location.href;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl rounded-2xl border border-border-color bg-[#0f1526] p-6 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-color pb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-accent-blue tracking-widest uppercase">Social Share</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-bold text-slate-300">{brandName} Visibility Card</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-[#1a2035] hover:text-white transition cursor-pointer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* TWO-COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Generated Image Preview */}
          <div className="md:col-span-7 bg-[#050814] rounded-xl p-4 border border-border-color flex justify-center items-center overflow-hidden shadow-inner">
            <img
              src={imageSrc}
              alt="Generated Score Card"
              className="w-full max-w-lg h-auto rounded-lg border border-border-color object-contain shadow-md"
            />
          </div>

          {/* RIGHT COLUMN: Share Actions */}
          <div className="md:col-span-5 space-y-6 flex flex-col justify-between h-full">
            
            {/* Title / Description */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Share Impact</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Broadcast your AI search engine benchmark scores to your professional network and stakeholders.
              </p>
            </div>

            {/* Vertically Stacked Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Post to LinkedIn (Primary Blue Button) */}
              <button
                onClick={handleLinkedInShare}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-accent-blue hover:bg-blue-500 text-white py-3 px-4 text-xs font-bold transition shadow-md active:scale-[0.98] cursor-pointer"
              >
                {/* Custom LinkedIn icon */}
                <svg className="h-4.5 w-4.5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>Post to LinkedIn</span>
              </button>

              {/* Download Image (Outline) */}
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-600 hover:border-slate-400 bg-[#1a2035]/50 hover:bg-[#1a2035] text-white py-3 px-4 text-xs font-bold transition cursor-pointer"
              >
                <svg className="h-4.5 w-4.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Image</span>
              </button>

              {/* Copy Performance Link (Outline) */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-600 hover:border-slate-400 bg-[#1a2035]/50 hover:bg-[#1a2035] text-white py-3 px-4 text-xs font-bold transition cursor-pointer"
              >
                <svg className="h-4.5 w-4.5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>{copiedLink ? 'Performance Link Copied!' : 'Copy Performance Link'}</span>
              </button>
            </div>

            {/* Disclaimer Copy */}
            <div className="flex gap-2 items-start text-[10px] text-slate-500 leading-normal pt-4 border-t border-border-color/50 mt-4 uppercase font-bold tracking-wide">
              <svg className="h-4.5 w-4.5 text-slate-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Shared items are publicly accessible for 30 days. Sensitive competitor data is automatically redacted in shared assets.
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
