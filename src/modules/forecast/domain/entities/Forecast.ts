export interface DailyBar {
  date: string; // "YYYY-MM-DD"
  close: number;
}

export interface HistogramBucket {
  /** Center price of the bucket */
  price: number;
  /** Number of simulated paths landing in this bucket */
  count: number;
  /** True if bucket center is within the P10–P90 likely range */
  inRange: boolean;
}

export type ForecastConfidence = 'low' | 'medium' | 'high';

export interface ForecastResult {
  /** Last known close used as the simulation start */
  lastPrice: number;
  /** Median (P50) of simulated next-close distribution */
  median: number;
  /** 10th percentile — lower bound of the likely range */
  p10: number;
  /** 90th percentile — upper bound of the likely range */
  p90: number;
  /** Probability the next close is higher than lastPrice (0..1) */
  probUp: number;
  /** Daily volatility (std-dev of daily log returns), as a percentage */
  dailyVolatilityPct: number;
  /** Average daily drift, as a percentage */
  dailyDriftPct: number;
  /** Number of historical days used in the estimate */
  sampleDays: number;
  /** Number of Monte Carlo simulations run */
  simulations: number;
  confidence: ForecastConfidence;
  histogram: HistogramBucket[];
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: number; // epoch ms
}
