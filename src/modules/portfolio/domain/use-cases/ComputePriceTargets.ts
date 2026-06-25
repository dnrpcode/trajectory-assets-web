import type { DailyBar, MultiHorizonTargets, PriceTarget } from '../entities/Forecast';

// Standard normal inverse CDF for P25, P50, P75
const Z25 = -0.6745;
const Z50 =  0;
const Z75 =  0.6745;

const MIN_DAYS = 20;
// Cap daily drift at ±30% annualised to avoid unrealistic extrapolation
const MAX_DAILY_DRIFT = Math.log(1.30) / 252;

function lognormalPrice(
  lastPrice: number,
  drift: number,
  sigma: number,
  days: number,
  z: number,
): number {
  return lastPrice * Math.exp((drift - 0.5 * sigma * sigma) * days + sigma * Math.sqrt(days) * z);
}

function buildTarget(lastPrice: number, drift: number, sigma: number, days: number): PriceTarget {
  const bear = lognormalPrice(lastPrice, drift, sigma, days, Z25);
  const base = lognormalPrice(lastPrice, drift, sigma, days, Z50);
  const bull = lognormalPrice(lastPrice, drift, sigma, days, Z75);
  return {
    bear,
    base,
    bull,
    bearPct: ((bear - lastPrice) / lastPrice) * 100,
    basePct: ((base - lastPrice) / lastPrice) * 100,
    bullPct: ((bull - lastPrice) / lastPrice) * 100,
  };
}

export class ComputePriceTargets {
  execute(bars: DailyBar[]): MultiHorizonTargets | null {
    const closes = bars.map((b) => b.close).filter((c) => Number.isFinite(c) && c > 0);
    if (closes.length < MIN_DAYS) return null;

    const n = closes.length;
    const logReturns: number[] = [];
    for (let i = 1; i < n; i++) logReturns.push(Math.log(closes[i] / closes[i - 1]));

    const mu = logReturns.reduce((s, r) => s + r, 0) / logReturns.length;
    const variance = logReturns.reduce((s, r) => s + (r - mu) ** 2, 0) / (logReturns.length - 1);
    const sigma = Math.sqrt(variance);
    const lastPrice = closes[n - 1];

    const drift = Math.max(-MAX_DAILY_DRIFT, Math.min(MAX_DAILY_DRIFT, mu));

    return {
      lastPrice,
      sampleDays: n,
      annualizedVolPct: sigma * Math.sqrt(252) * 100,
      targets: {
        '1d':  buildTarget(lastPrice, drift, sigma, 1),
        '7d':  buildTarget(lastPrice, drift, sigma, 7),
        '30d': buildTarget(lastPrice, drift, sigma, 30),
        '1y':  buildTarget(lastPrice, drift, sigma, 252),
      },
    };
  }
}

export const computePriceTargets = new ComputePriceTargets();
