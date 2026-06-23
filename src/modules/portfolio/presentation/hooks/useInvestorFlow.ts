import { useQuery } from '@tanstack/react-query';

export interface FlowSeriesPoint {
  date: string;
  close: number;
  volume: number;
  cmf: number | null;
  mfi: number | null;
  obv: number;
  adl: number;
  buyPct: number;
  netFlow: number;
}

export interface ScorecardPoint extends FlowSeriesPoint {
  daySignal: 'accumulation' | 'distribution' | 'neutral';
}

export type FlowSignal = 'strong_accumulation' | 'accumulation' | 'neutral' | 'distribution' | 'strong_distribution';

export interface InvestorFlowData {
  ticker: string;
  symbol: string;
  series: FlowSeriesPoint[];
  scorecard: ScorecardPoint[];
  latestCmf: number;
  latestMfi: number;
  latestBuyPct: number;
  cmfTrend: 'rising' | 'falling' | 'neutral';
  obvTrend: 'rising' | 'falling' | 'flat';
  obvChangePct: number;
  accDays: number;
  distDays: number;
  signal: FlowSignal;
  narrative: string[];
  score: number;
}

async function fetchInvestorFlow(ticker: string): Promise<InvestorFlowData> {
  const code = ticker.replace(/\.JK$/i, '').toUpperCase();
  const res = await fetch(`/api/market/flow?ticker=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`Flow fetch failed: ${res.status}`);
  return res.json();
}

export function useInvestorFlow(ticker: string | undefined) {
  return useQuery({
    queryKey: ['investorFlow', ticker],
    queryFn: () => fetchInvestorFlow(ticker!),
    enabled: !!ticker,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
