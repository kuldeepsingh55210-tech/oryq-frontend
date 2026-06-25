interface HallucinationCardProps {
  claim: string;
  sourceResponse: string;
  provider: string;
  severity: string;
}

export default function HallucinationCard({
  claim,
  sourceResponse,
  provider,
  severity,
}: HallucinationCardProps) {
  // Truncate function
  const truncateText = (text: string, limit: number) => {
    if (!text) return '';
    return text.length > limit ? `${text.substring(0, limit)}...` : text;
  };

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-accent-red/20 text-accent-red border border-accent-red/30';
      case 'medium':
        return 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30';
      default:
        return 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30';
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border-l-4 border-l-accent-red border-y border-r border-border-color bg-card-light p-5 md:p-6 shadow-md transition hover:-translate-y-0.5 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-md bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-200 uppercase tracking-widest">
          {provider}
        </span>
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
          <span className={getSeverityColor(severity)}>{severity} severity</span>
        </span>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-red-300 leading-snug">
          {claim}
        </h4>
        <div className="rounded-lg bg-card p-3 border border-border-color">
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            AI Source Response
          </span>
          <p className="text-xs italic text-slate-300 leading-relaxed">
            "{truncateText(sourceResponse, 150)}"
          </p>
        </div>
      </div>
    </div>
  );
}
