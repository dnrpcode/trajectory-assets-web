import { useQuery } from '@tanstack/react-query';

export interface FlowDataPoint {
  date: string;
  cmf: number | null;
  obv: number;
  adl: number;
  close: number;
  volume: number;
}

export type FlowSignal = 'strong_accumulation' | 'accumulation' | 'neutral' | 'distribution' | 'strong_distribution';

export interface InvestorFlowData {
  ticker: string;
  symbol: string;
  series: FlowDataPoint[];
  cmf: number;
  cmfTrend: 'rising' | 'falling' | 'neutral';
  obvTrend: 'rising' | 'falling' | 'flat';
  signal: FlowSignal;
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
