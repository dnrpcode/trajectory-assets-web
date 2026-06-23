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

export type FlowSignal =
  | 'strong_accumulation'
  | 'accumulation'
  | 'neutral'
  | 'distribution'
  | 'strong_distribution';

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
