import React, { forwardRef } from 'react';

interface ShareableScoreCardProps {
  brandName: string;
  score: number;
  mentioned: number;
  total: number;
  statusLabel: string;
}

export const ShareableScoreCard = forwardRef<HTMLDivElement, ShareableScoreCardProps>(
  ({ brandName, score, mentioned, total, statusLabel }, ref) => {
    // Color coding mapping based on score
    let scoreColor = '#ef4444'; // Red-500
    let scoreBg = 'rgba(239, 68, 68, 0.1)';
    let scoreBorder = 'rgba(239, 68, 68, 0.2)';
    
    if (score >= 70) {
      scoreColor = '#22c55e'; // Green-500
      scoreBg = 'rgba(34, 197, 94, 0.1)';
      scoreBorder = 'rgba(34, 197, 94, 0.2)';
    } else if (score >= 40) {
      scoreColor = '#f59e0b'; // Amber-500
      scoreBg = 'rgba(245, 158, 11, 0.1)';
      scoreBorder = 'rgba(245, 158, 11, 0.2)';
    }

    return (
      <div
        ref={ref}
        style={{
          width: '1200px',
          height: '630px',
          backgroundColor: '#0a0e1a',
          backgroundImage: 'radial-gradient(circle at 80% 20%, #151b2e 0%, #0a0e1a 75%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Grid Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.04,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Colored Radial Glow behind Score */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${scoreColor}18 0%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg
              style={{ height: '36px', width: '36px', color: '#3b82f6' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ fontSize: '34px', fontWeight: '900', letterSpacing: '-0.05em' }}>
              <span style={{ color: '#3b82f6' }}>ORYQ</span>
            </span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8' }}>
            AI Visibility Report
          </span>
        </div>

        {/* Main Score & Brand Info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, zIndex: 10, margin: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span style={{ fontSize: '190px', fontWeight: '950', lineHeight: '1', color: scoreColor, letterSpacing: '-0.05em' }}>
              {score}
            </span>
            <span style={{ fontSize: '38px', fontWeight: '800', color: '#64748b', marginLeft: '12px' }}>
              /100
            </span>
          </div>
          
          <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#ffffff', marginTop: '15px', textAlign: 'center', letterSpacing: '-0.02em' }}>
            {brandName}&apos;s AI Visibility Score
          </h2>
          
          <p style={{ fontSize: '20px', color: '#94a3b8', marginTop: '10px', fontWeight: '500' }}>
            {mentioned} out of {total} AI responses mentioned this brand
          </p>
        </div>

        {/* Bottom Metadata & CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div
            style={{
              backgroundColor: scoreBg,
              border: `1px solid ${scoreBorder}`,
              borderRadius: '9999px',
              padding: '8px 24px',
              fontSize: '14px',
              fontWeight: '800',
              color: scoreColor,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {statusLabel}
          </div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
            Scan your brand free at <span style={{ textDecoration: 'underline' }}>oryq.ai</span>
          </span>
        </div>
      </div>
    );
  }
);

ShareableScoreCard.displayName = 'ShareableScoreCard';
