'use client';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading results...' }: LoadingScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#050814] p-6 text-center min-h-[50vh] animate-fade-in">
      <div className="relative flex items-center justify-center h-28 w-28">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-20 w-20 animate-pulse rounded-full bg-accent-blue/5 border border-accent-blue/15 shadow-[0_0_15px_rgba(59,130,246,0.15)]" />
        
        {/* Inner high-contrast spinner */}
        <div className="absolute h-14 w-14 animate-spin rounded-full border-2 border-transparent border-t-accent-blue border-r-accent-blue/30" />
      </div>
      
      <div className="space-y-1.5 mt-4">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">System Processing</span>
        <p className="text-sm font-semibold text-slate-300 animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
