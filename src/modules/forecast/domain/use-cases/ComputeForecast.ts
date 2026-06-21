import type { DailyBar, ForecastResult, ForecastConfidence, HistogramBucket } from '../entities/Forecast';

/** Standard normal sample via Box–Muller transform. */
function randNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Percentile of a pre-sorted ascending array (linear interpolation). */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const frac = idx - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

function classifyConfidence(dailyVol: number): ForecastConfidence {
  // dailyVol is a fraction (e.g. 0.02 = 2%)
  if (dailyVol < 0.015) return 'high';
  if (dailyVol < 0.03) return 'medium';
  return 'low';
}

const MIN_DAYS = 20;
const HISTOGRAM_BUCKETS = 13;

/**
 * Monte Carlo one-step forecast of the next closing price using a
 * Geometric Brownian Motion model fitted to historical daily log returns.
 *
 * Pure & framework-free — no network, no AI. Returns null when there is
 * not enough clean data to produce a meaningful estimate.
 */
export class ComputeForecast {
  execute(bars: DailyBar[], simulations = 1000): ForecastResult | null {
    const closes = bars
      .map((b) => b.close)
      .filter((c) => Number.isFinite(c) && c > 0);

    if (closes.length < MIN_DAYS) return null;

    // Daily log returns
    const logReturns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      logReturns.push(Math.log(closes[i] / closes[i - 1]));
    }

    const n = logReturns.length;
    const mu = logReturns.reduce((s, r) => s + r, 0) / n;
    const variance = logReturns.reduce((s, r) => s + (r - mu) ** 2, 0) / (n - 1);
    const sigma = Math.sqrt(variance);

    const lastPrice = closes[closes.length - 1];

    // Simulate one trading day forward via GBM
    const drift = mu - 0.5 * sigma * sigma;
    const sims: number[] = new Array(simulations);
    for (let i = 0; i < simulations; i++) {
      sims[i] = lastPrice * Math.exp(drift + sigma * randNormal());
    }
    sims.sort((a, b) => a - b);

    const median = percentile(sims, 0.5);
    const p10 = percentile(sims, 0.1);
    const p90 = percentile(sims, 0.9);
    const probUp = sims.filter((s) => s > lastPrice).length / simulations;

    // Histogram for visualization
    const min = sims[0];
    const max = sims[sims.length - 1];
    const span = max - min || 1;
    const width = span / HISTOGRAM_BUCKETS;
    const counts = new Array(HISTOGRAM_BUCKETS).fill(0) as number[];
    for (const s of sims) {
      let idx = Math.floor((s - min) / width);
      if (idx >= HISTOGRAM_BUCKETS) idx = HISTOGRAM_BUCKETS - 1;
      counts[idx]++;
    }
    const histogram: HistogramBucket[] = counts.map((count, i) => {
      const price = min + width * (i + 0.5);
      return { price, count, inRange: price >= p10 && price <= p90 };
    });

    return {
      lastPrice,
      median,
      p10,
      p90,
      probUp,
      dailyVolatilityPct: sigma * 100,
      dailyDriftPct: mu * 100,
      sampleDays: closes.length,
      simulations,
      confidence: classifyConfidence(sigma),
      histogram,
    };
  }
}

export const computeForecast = new ComputeForecast();
