import { useQuery } from '@tanstack/react-query';

export interface TopHolder {
  name: string;
  reportDate: string;
  pctHeld: number;
  position: number;
  value: number;
  pctChange: number;
}

export interface InvestorFlowData {
  ticker: string;
  symbol: string;
  insider:     { pct: number };
  institution: { pct: number; count: number };
  retail:      { pct: number };
  topHolders:  TopHolder[];
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
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}
