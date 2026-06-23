import { useQuery } from '@tanstack/react-query';

export interface InvestorFlowData {
  ticker: string;
  date: string;
  foreign:  { buy: number; sell: number; net: number };
  domestic: { buy: number; sell: number; net: number };
  total: number;
  lastPrice: number;
  change: number;
  volume: number;
}

async function fetchInvestorFlow(ticker: string): Promise<InvestorFlowData> {
  // ticker may include .JK — strip it for IDX
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
    staleTime: 15 * 60 * 1000,
    retry: 1,
  });
}
