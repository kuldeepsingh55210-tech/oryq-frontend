export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ProviderSummary {
  provider: string;
  score: number;
  mentions: number;
  total: number;
}

export interface ScanStartResponse {
  scan_job_id: string;
  status: string;
  score: number;
  total_prompts_run: number;
  brand_mentioned_count: number;
  total_cost_usd: number;
  results_summary: ProviderSummary[];
}

export interface FullScanResult {
  prompt_text: string;
  provider: string;
  brand_mentioned: boolean;
  response_snippet: string;
  cost_usd: number;
  latency_ms: number;
}

export interface HeadlineEvidence {
  type: 'missed_mention' | 'hallucination' | 'none';
  prompt_text: string | null;
  ai_response_snippet: string | null;
  provider: string | null;
  claim: string | null;
}

export interface ScanTrend {
  has_previous: boolean;
  change_percent: number | null;
  direction: 'up' | 'down' | 'flat' | null;
}

export interface ScanStatusResponse {
  scan_job_id: string;
  status: string;
  score: number;
  total_cost_usd: number;
  results: FullScanResult[];
  headline_evidence?: HeadlineEvidence;
  trend?: ScanTrend;
}

export interface BrandHistoryItem {
  scan_job_id: string;
  score: number;
  created_at: string;
  total_prompts_run: number;
}

export interface CompetitorBrand {
  name: string;
  score: number;
  mentions: number;
}

export interface CompetitorResponse {
  main_brand: CompetitorBrand;
  competitors: CompetitorBrand[];
  rank: number;
  gap_to_leader: number;
}

export interface HallucinationItem {
  claim: string;
  source_response: string;
  provider: string;
  severity: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = 'API Request failed';
    try {
      const errBody = await response.json();
      errorDetail = errBody?.detail || errorDetail;
    } catch {
      // Fallback if not json
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export async function startScan(
  brandName: string,
  websiteUrl: string,
  industry: string
): Promise<ScanStartResponse> {
  return request<ScanStartResponse>('/api/v1/scan/start', {
    method: 'POST',
    body: JSON.stringify({
      brand_name: brandName,
      website_url: websiteUrl,
      industry: industry,
      run_all_providers: true,
    }),
  });
}

export async function getScanStatus(scanJobId: string): Promise<ScanStatusResponse> {
  return request<ScanStatusResponse>(`/api/v1/scan/${scanJobId}`);
}

export async function compareCompetitors(
  scanJobId: string,
  competitorNames: string[]
): Promise<CompetitorResponse> {
  return request<CompetitorResponse>(`/api/v1/scan/${scanJobId}/competitors`, {
    method: 'POST',
    body: JSON.stringify({
      competitor_names: competitorNames,
    }),
  });
}

export async function checkHallucinations(
  scanJobId: string,
  knownFacts: Record<string, string>
): Promise<HallucinationItem[]> {
  return request<HallucinationItem[]>(`/api/v1/scan/${scanJobId}/hallucinations`, {
    method: 'POST',
    body: JSON.stringify({
      known_facts: knownFacts,
    }),
  });
}

export async function getBrandHistory(brandName: string): Promise<BrandHistoryItem[]> {
  return request<BrandHistoryItem[]>(`/api/v1/scan/brands/${encodeURIComponent(brandName)}/history`);
}

export async function emailScanReport(scanJobId: string, email: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/v1/scan/${scanJobId}/email`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export interface GeneratedContent {
  content_type: string;
  generated_text: string;
  generated_code?: string;
  instructions: string;
}

export interface RecommendationItem {
  category: string;
  title: string;
  action: string;
  effort: string;
  impact: string;
  generated_content?: GeneratedContent | null;
}

export async function getRecommendations(scanJobId: string): Promise<RecommendationItem[]> {
  return request<RecommendationItem[]>(`/api/v1/scan/${scanJobId}/recommendations`);
}


