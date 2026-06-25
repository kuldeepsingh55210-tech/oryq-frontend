'use client';

import { useEffect, useState } from 'react';

interface BrandScore {
  name: string;
  score: number;
}

interface CompetitorChartProps {
  mainBrand: BrandScore;
  competitors: BrandScore[];
  rank: number;
  gapToLeader: number;
}

export default function CompetitorChart({
  mainBrand,
  competitors,
  rank,
  gapToLeader,
}: CompetitorChartProps) {
  const [animate, setAnimate] = useState(false);

  // Combine and sort descending by score
  const allBrands = [
    { ...mainBrand, isMain: true },
    ...competitors.map((c) => ({ ...c, isMain: false })),
  ].sort((a, b) => b.score - a.score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full rounded-2xl border border-border-color bg-card p-6 md:p-8 backdrop-blur-md shadow-lg">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Competitor Comparison</h3>
          <p className="text-xs text-secondary mt-1">
            Comparative visibility score against industry rivals
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:text-right">
          <span className="text-sm font-semibold text-secondary">
            Rank:{' '}
            <span className="text-xl font-black text-accent-blue">
              #{rank}
            </span>{' '}
            out of {allBrands.length}
          </span>
          <span className="text-xs font-medium text-secondary">
            {rank === 1 ? (
              <span className="text-accent-green font-bold">★ Market Leader</span>
            ) : (
              <span>
                <strong className="text-white">{Math.round(gapToLeader)}</strong> points behind the leader
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {allBrands.map((brand) => {
          // Normalizing bar width. Let's make it minimum 5% to look good even at 0.
          const targetWidth = `${Math.max(5, Math.round(brand.score))}%`;
          
          return (
            <div key={brand.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-white flex items-center">
                  {brand.name}
                  {brand.isMain && (
                    <span className="ml-2 text-xs text-blue-400 font-bold uppercase tracking-widest">
                      (You)
                    </span>
                  )}
                </span>
                <span className="font-semibold text-white">
                  {Math.round(brand.score)} / 100
                </span>
              </div>
              
              <div className="relative h-6 w-full rounded-lg overflow-hidden bg-slate-800 border border-border-color">
                {/* Visual fill bar */}
                <div
                  style={{ width: animate ? targetWidth : '0%' }}
                  className={`h-full rounded-r-md transition-all duration-1000 ease-out ${
                    brand.isMain
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                      : 'bg-slate-400'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
