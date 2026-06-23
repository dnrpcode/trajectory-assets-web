import type {
  DailyBar, ForecastResult, ForecastConfidence,
  HistogramBucket, TechnicalSignals, PriceLevels,
  RsiSignal, TrendSignal,
} from '../entities/Forecast';

function randNormal(): number {
  let u = 0; let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (1 - (idx - lo)) + sorted[hi] * (idx - lo);
}

function sma(arr: number[], period: number, endIdx: number): number | null {
  if (endIdx < period - 1) return null;
  let sum = 0;
  for (let i = endIdx - period + 1; i <= endIdx; i++) sum += arr[i];
  return sum / period;
}

function stddev(arr: number[], period: number, endIdx: number): number | null {
  const mean = sma(arr, period, endIdx);
  if (mean === null) return null;
  let sq = 0;
  for (let i = endIdx - period + 1; i <= endIdx; i++) sq += (arr[i] - mean) ** 2;
  return Math.sqrt(sq / period);
}

/** RSI(14) from close prices. */
function computeRsi(closes: number[]): number | null {
  const PERIOD = 14;
  if (closes.length < PERIOD + 1) return null;
  const n = closes.length;
  let gains = 0; let losses = 0;
  for (let i = n - PERIOD; i < n; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = (gains / PERIOD) / (losses / PERIOD);
  return 100 - (100 / (1 + rs));
}

/** Bollinger Band %B: 0 = lower band, 100 = upper band. */
function computeBollingerPct(closes: number[]): number | null {
  const PERIOD = 20; const MULT = 2;
  const n = closes.length;
  if (n < PERIOD) return null;
  const mean = sma(closes, PERIOD, n - 1)!;
  const sd = stddev(closes, PERIOD, n - 1)!;
  if (sd === 0) return 50;
  const upper = mean + MULT * sd;
  const lower = mean - MULT * sd;
  const current = closes[n - 1];
  return ((current - lower) / (upper - lower)) * 100;
}

/** Find swing support/resistance from recent N bars. */
function computeLevels(closes: number[], lastPrice: number): PriceLevels {
  // 52W stats (all bars, max 252)
  const window52 = closes.slice(-252);
  const high52w = Math.max(...window52);
  const low52w = Math.min(...window52);
  const range52 = high52w - low52w;
  const priceVs52wPct = range52 > 0 ? ((lastPrice - low52w) / range52) * 100 : 50;

  // Swing highs/lows from last 60 bars
  const recent = closes.slice(-60);
  const WING = 3; // bars each side
  const swingHighs: number[] = [];
  const swingLows: number[] = [];

  for (let i = WING; i < recent.length - WING; i++) {
    const slice = recent.slice(i - WING, i + WING + 1);
    const center = recent[i];
    if (center === Math.max(...slice)) swingHighs.push(center);
    if (center === Math.min(...slice)) swingLows.push(center);
  }

  // Support = highest swing low below current price
  const belowLows = swingLows.filter((p) => p < lastPrice).sort((a, b) => b - a);
  const support = belowLows[0] ?? null;

  // Resistance = lowest swing high above current price
  const aboveHighs = swingHighs.filter((p) => p > lastPrice).sort((a, b) => a - b);
  const resistance = aboveHighs[0] ?? null;

  return { support, resistance, high52w, low52w, priceVs52wPct };
}

/** Composite trend signal from RSI + momentum. */
function composeTrend(rsi: number | null, mom5: number | null, mom20: number | null): TrendSignal {
  let score = 0;
  if (rsi !== null) {
    if (rsi > 60) score += 1;
    else if (rsi > 50) score += 0.5;
    else if (rsi < 40) score -= 1;
    else if (rsi < 50) score -= 0.5;
  }
  if (mom5 !== null) {
    if (mom5 > 3) score += 1.5;
    else if (mom5 > 1) score += 0.75;
    else if (mom5 < -3) score -= 1.5;
    else if (mom5 < -1) score -= 0.75;
  }
  if (mom20 !== null) {
    if (mom20 > 5) score += 1;
    else if (mom20 > 2) score += 0.5;
    else if (mom20 < -5) score -= 1;
    else if (mom20 < -2) score -= 0.5;
  }
  if (score >= 2.5) return 'strong_up';
  if (score >= 1) return 'up';
  if (score <= -2.5) return 'strong_down';
  if (score <= -1) return 'down';
  return 'flat';
}

function classifyConfidence(dailyVol: number): ForecastConfidence {
  if (dailyVol < 0.015) return 'high';
  if (dailyVol < 0.03) return 'medium';
  return 'low';
}

const MIN_DAYS = 20;
const HISTOGRAM_BUCKETS = 17;

export class ComputeForecast {
  execute(bars: DailyBar[], simulations = 2000): ForecastResult | null {
    const closes = bars
      .map((b) => b.close)
      .filter((c) => Number.isFinite(c) && c > 0);

    if (closes.length < MIN_DAYS) return null;

    const n = closes.length;

    // Daily log returns
    const logReturns: number[] = [];
    for (let i = 1; i < n; i++) logReturns.push(Math.log(closes[i] / closes[i - 1]));

    const mu = logReturns.reduce((s, r) => s + r, 0) / logReturns.length;
    const variance = logReturns.reduce((s, r) => s + (r - mu) ** 2, 0) / (logReturns.length - 1);
    const sigma = Math.sqrt(variance);

    const lastPrice = closes[n - 1];

    // Monte Carlo — zero drift (random walk, 1-day horizon)
    const drift = -0.5 * sigma * sigma;
    const sims: number[] = new Array(simulations);
    for (let i = 0; i < simulations; i++) {
      sims[i] = lastPrice * Math.exp(drift + sigma * randNormal());
    }
    sims.sort((a, b) => a - b);

    const median = pct(sims, 0.5);
    const p10 = pct(sims, 0.1);
    const p25 = pct(sims, 0.25);
    const p75 = pct(sims, 0.75);
    const p90 = pct(sims, 0.9);
    const probUp = sims.filter((s) => s > lastPrice).length / simulations;

    // Histogram — P25–P75 is "inRange"
    const min = sims[0]; const max = sims[sims.length - 1];
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
      return { price, count, inRange: price >= p25 && price <= p75 };
    });

    // Technical signals
    const rsi14 = computeRsi(closes);
    const rsiSignal: RsiSignal | null = rsi14 === null ? null
      : rsi14 < 30 ? 'oversold' : rsi14 > 70 ? 'overbought' : 'neutral';

    const bollingerPct = computeBollingerPct(closes);

    const mom5 = n >= 6
      ? ((closes[n - 1] - closes[n - 6]) / closes[n - 6]) * 100 : null;
    const mom20 = n >= 21
      ? ((closes[n - 1] - closes[n - 21]) / closes[n - 21]) * 100 : null;

    const pctReturns = logReturns.map((r) => (Math.exp(r) - 1) * 100);
    const bestDayPct = Math.max(...pctReturns);
    const worstDayPct = Math.min(...pctReturns);
    const expectedDailyRangePct = pctReturns.map(Math.abs).reduce((s, v) => s + v, 0) / pctReturns.length;
    const annualizedVolPct = sigma * Math.sqrt(252) * 100;

    const technical: TechnicalSignals = {
      rsi14,
      rsiSignal,
      bollingerPct,
      momentum5d: mom5,
      momentum20d: mom20,
      trendSignal: composeTrend(rsi14, mom5, mom20),
      expectedDailyRangePct,
      annualizedVolPct,
      bestDayPct,
      worstDayPct,
    };

    const levels = computeLevels(closes, lastPrice);

    return {
      lastPrice,
      median,
      p10, p25, p75, p90,
      probUp,
      dailyVolatilityPct: sigma * 100,
      dailyDriftPct: mu * 100,
      sampleDays: n,
      simulations,
      confidence: classifyConfidence(sigma),
      histogram,
      technical,
      levels,
    };
  }
}

export const computeForecast = new ComputeForecast();
