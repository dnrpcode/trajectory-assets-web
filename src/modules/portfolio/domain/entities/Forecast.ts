export interface DailyBar {
  date: string; // "YYYY-MM-DD"
  close: number;
}

export interface HistogramBucket {
  price: number;
  count: number;
  inRange: boolean; // within P25–P75
}

export type ForecastConfidence = 'low' | 'medium' | 'high';

export type RsiSignal = 'oversold' | 'neutral' | 'overbought';
export type TrendSignal = 'strong_up' | 'up' | 'flat' | 'down' | 'strong_down';

export interface TechnicalSignals {
  rsi14: number | null;
  rsiSignal: RsiSignal | null;
  bollingerPct: number | null;   // 0 = lower band, 100 = upper band
  momentum5d: number | null;     // % return over last 5 sessions
  momentum20d: number | null;    // % return over last 20 sessions
  trendSignal: TrendSignal;      // composite trend reading
  expectedDailyRangePct: number; // ATR proxy as % of price
  annualizedVolPct: number;      // sigma * sqrt(252) * 100
  bestDayPct: number;            // max single-day return in sample
  worstDayPct: number;           // min single-day return in sample
}

export interface PriceLevels {
  support: number | null;
  resistance: number | null;
  high52w: number;
  low52w: number;
  priceVs52wPct: number; // 0 = at 52W low, 100 = at 52W high
}

export interface ForecastResult {
  lastPrice: number;
  median: number; // P50
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  probUp: number; // 0..1
  dailyVolatilityPct: number;
  dailyDriftPct: number;
  sampleDays: number;
  simulations: number;
  confidence: ForecastConfidence;
  histogram: HistogramBucket[];
  technical: TechnicalSignals;
  levels: PriceLevels;
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: number; // epoch ms
}
