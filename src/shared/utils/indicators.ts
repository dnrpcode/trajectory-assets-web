export type TradingSignal = 'BUY' | 'SELL' | 'HOLD';

export function computeMA(prices: number[], period: number): number[] {
  return prices.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

export function computeEMA(prices: number[], period: number): number[] {
  const ema: number[] = new Array(prices.length).fill(NaN);
  if (prices.length < period) return ema;
  const k = 2 / (period + 1);
  let prev = prices.slice(0, period).reduce((s, v) => s + v, 0) / period;
  ema[period - 1] = prev;
  for (let i = period; i < prices.length; i++) {
    prev = prices[i] * k + prev * (1 - k);
    ema[i] = prev;
  }
  return ema;
}

export function computeRSI(prices: number[], period = 14): number[] {
  const rsi: number[] = new Array(prices.length).fill(NaN);
  if (prices.length < period + 1) return rsi;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const r = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + r);
  }

  return rsi;
}

export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function computeMACD(prices: number[], fast = 12, slow = 26, signalPeriod = 9): MACDResult {
  const emaFast = computeEMA(prices, fast);
  const emaSlow = computeEMA(prices, slow);
  const macdLine = prices.map((_, i) => emaFast[i] - emaSlow[i]);

  // Signal line = EMA(9) dari MACD line, dihitung mulai dari titik valid pertama
  const start = slow - 1;
  const signalLine: number[] = new Array(prices.length).fill(NaN);
  const segEma = computeEMA(macdLine.slice(start), signalPeriod);
  segEma.forEach((v, i) => { signalLine[start + i] = v; });

  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

export type FactorVerdict = 'bullish' | 'bearish' | 'neutral';
export type SignalConfidence = 'weak' | 'moderate' | 'strong';

/**
 * Satu faktor analisa. `key` adalah kunci i18n stabil (trading.factors.<key>)
 * dan `params` adalah nilai interpolasinya — presentasi yang menerjemahkan,
 * domain hanya mengirim data terstruktur.
 */
export interface SignalFactor {
  key: string;
  verdict: FactorVerdict;
  weight: number;
  params: Record<string, string | number>;
}

export interface SignalResult {
  signal: TradingSignal;
  rsi: number;
  ma7: number;
  ma25: number;
  score: number; // -100 (bearish ekstrem) … +100 (bullish ekstrem)
  confidence: SignalConfidence;
  factors: SignalFactor[];
  reason: string; // ringkasan pendek untuk kartu/list
}

// Ambang skor komposit: satu faktor kuat saja belum cukup memicu sinyal —
// butuh konfirmasi minimal dua faktor searah.
const SIGNAL_THRESHOLD = 30;
const STRONG_THRESHOLD = 60;

const SHORT_LABELS: Record<string, (p: Record<string, string | number>) => string> = {
  rsiOversold: (p) => `RSI oversold (${p.rsi})`,
  rsiOverbought: (p) => `RSI overbought (${p.rsi})`,
  maGoldenCross: () => 'Golden cross MA7/MA25',
  maDeathCross: () => 'Death cross MA7/MA25',
  maBullish: () => 'MA7 > MA25',
  maBearish: () => 'MA7 < MA25',
  macdBullishRising: () => 'MACD menguat',
  macdBearishFalling: () => 'MACD melemah',
  nearSupport: () => 'dekat support',
  nearResistance: () => 'dekat resistance',
  momentumUp: (p) => `momentum +${p.roc}%`,
  momentumDown: (p) => `momentum ${p.roc}%`,
};

function shortLabel(f: SignalFactor): string | null {
  const fn = SHORT_LABELS[f.key];
  return fn ? fn(f.params) : null;
}

export function computeSignal(closes: number[]): SignalResult {
  const rsiArr = computeRSI(closes, 14);
  const ma7Arr = computeMA(closes, 7);
  const ma25Arr = computeMA(closes, 25);

  const rsi = rsiArr[rsiArr.length - 1] ?? NaN;
  const rsiPrev = rsiArr[rsiArr.length - 2] ?? NaN;
  const ma7 = ma7Arr[ma7Arr.length - 1] ?? NaN;
  const ma25 = ma25Arr[ma25Arr.length - 1] ?? NaN;
  const ma7Prev = ma7Arr[ma7Arr.length - 2] ?? NaN;
  const ma25Prev = ma25Arr[ma25Arr.length - 2] ?? NaN;
  const price = closes[closes.length - 1] ?? NaN;

  if (isNaN(rsi) || isNaN(ma7) || isNaN(ma25) || isNaN(price)) {
    return {
      signal: 'HOLD', rsi, ma7, ma25, score: 0, confidence: 'weak',
      factors: [{ key: 'insufficientData', verdict: 'neutral', weight: 0, params: { candles: closes.length } }],
      reason: 'Data tidak cukup',
    };
  }

  const factors: SignalFactor[] = [];

  // ── 1. RSI level (+ arah untuk konteks)
  const rsiDir = isNaN(rsiPrev) ? 'flat' : rsi > rsiPrev ? 'rising' : 'falling';
  const rsiRounded = Math.round(rsi);
  if (rsi < 30) {
    factors.push({ key: 'rsiOversold', verdict: 'bullish', weight: rsi < 25 ? 34 : 28, params: { rsi: rsiRounded } });
  } else if (rsi > 70) {
    factors.push({ key: 'rsiOverbought', verdict: 'bearish', weight: rsi > 75 ? -34 : -28, params: { rsi: rsiRounded } });
  } else if (rsi <= 42 && rsiDir === 'rising') {
    factors.push({ key: 'rsiRecovering', verdict: 'bullish', weight: 10, params: { rsi: rsiRounded } });
  } else if (rsi >= 58 && rsiDir === 'falling') {
    factors.push({ key: 'rsiWeakening', verdict: 'bearish', weight: -10, params: { rsi: rsiRounded } });
  } else {
    factors.push({ key: 'rsiNeutral', verdict: 'neutral', weight: 0, params: { rsi: rsiRounded } });
  }

  // ── 2. MA cross / posisi MA7 vs MA25
  const maGapPct = ((ma7 - ma25) / ma25) * 100;
  const goldenCross = !isNaN(ma7Prev) && !isNaN(ma25Prev) && ma7Prev < ma25Prev && ma7 >= ma25;
  const deathCross = !isNaN(ma7Prev) && !isNaN(ma25Prev) && ma7Prev > ma25Prev && ma7 <= ma25;
  if (goldenCross) {
    factors.push({ key: 'maGoldenCross', verdict: 'bullish', weight: 25, params: {} });
  } else if (deathCross) {
    factors.push({ key: 'maDeathCross', verdict: 'bearish', weight: -25, params: {} });
  } else if (maGapPct > 0.15) {
    factors.push({ key: 'maBullish', verdict: 'bullish', weight: 12, params: { gap: maGapPct.toFixed(1) } });
  } else if (maGapPct < -0.15) {
    factors.push({ key: 'maBearish', verdict: 'bearish', weight: -12, params: { gap: Math.abs(maGapPct).toFixed(1) } });
  } else {
    factors.push({ key: 'maFlat', verdict: 'neutral', weight: 0, params: {} });
  }

  // ── 3. Posisi harga vs MA25 (konteks tren menengah)
  const priceVsMa25 = ((price - ma25) / ma25) * 100;
  if (priceVsMa25 > 0.5) {
    factors.push({ key: 'priceAboveMa25', verdict: 'bullish', weight: 8, params: { gap: priceVsMa25.toFixed(1) } });
  } else if (priceVsMa25 < -0.5) {
    factors.push({ key: 'priceBelowMa25', verdict: 'bearish', weight: -8, params: { gap: Math.abs(priceVsMa25).toFixed(1) } });
  } else {
    factors.push({ key: 'priceAtMa25', verdict: 'neutral', weight: 0, params: {} });
  }

  // ── 4. MACD histogram: arah momentum
  const { histogram } = computeMACD(closes);
  const hist = histogram[histogram.length - 1];
  const histPrev = histogram[histogram.length - 2];
  if (!isNaN(hist) && !isNaN(histPrev)) {
    const rising = hist > histPrev;
    if (hist > 0 && rising) {
      factors.push({ key: 'macdBullishRising', verdict: 'bullish', weight: 16, params: {} });
    } else if (hist > 0) {
      factors.push({ key: 'macdBullishFading', verdict: 'neutral', weight: 4, params: {} });
    } else if (hist < 0 && !rising) {
      factors.push({ key: 'macdBearishFalling', verdict: 'bearish', weight: -16, params: {} });
    } else {
      factors.push({ key: 'macdBearishFading', verdict: 'neutral', weight: -4, params: {} });
    }
  }

  // ── 5. Momentum: rate of change 7 candle terakhir
  const prev7 = closes[closes.length - 8];
  if (prev7 !== undefined && prev7 > 0) {
    const roc = ((price - prev7) / prev7) * 100;
    if (roc > 4) {
      factors.push({ key: 'momentumUp', verdict: 'bullish', weight: 8, params: { roc: roc.toFixed(1) } });
    } else if (roc < -4) {
      factors.push({ key: 'momentumDown', verdict: 'bearish', weight: -8, params: { roc: roc.toFixed(1) } });
    } else {
      factors.push({ key: 'momentumFlat', verdict: 'neutral', weight: 0, params: { roc: roc.toFixed(1) } });
    }
  }

  // ── 6. Jarak ke support/resistance (swing low/high 20 candle)
  if (closes.length >= 20) {
    const recent = closes.slice(-20);
    const swingLow = Math.min(...recent);
    const swingHigh = Math.max(...recent);
    const distToLow = ((price - swingLow) / price) * 100;
    const distToHigh = ((swingHigh - price) / price) * 100;
    if (distToLow < 3) {
      factors.push({ key: 'nearSupport', verdict: 'bullish', weight: 12, params: { dist: distToLow.toFixed(1) } });
    } else if (distToHigh < 3) {
      factors.push({ key: 'nearResistance', verdict: 'bearish', weight: -12, params: { dist: distToHigh.toFixed(1) } });
    } else {
      factors.push({ key: 'midRange', verdict: 'neutral', weight: 0, params: { low: distToLow.toFixed(0), high: distToHigh.toFixed(0) } });
    }
  }

  const rawScore = factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.max(-100, Math.min(100, Math.round(rawScore)));

  const signal: TradingSignal = score >= SIGNAL_THRESHOLD ? 'BUY' : score <= -SIGNAL_THRESHOLD ? 'SELL' : 'HOLD';
  const confidence: SignalConfidence =
    Math.abs(score) >= STRONG_THRESHOLD ? 'strong' : Math.abs(score) >= SIGNAL_THRESHOLD ? 'moderate' : 'weak';

  // Ringkasan pendek: 2 faktor searah paling berpengaruh
  let reason: string;
  if (signal === 'HOLD') {
    reason = `RSI ${rsiRounded} · MA7 ${ma7 > ma25 ? '>' : '<'} MA25 · skor ${score >= 0 ? '+' : ''}${score}`;
  } else {
    const aligned = factors
      .filter((f) => (signal === 'BUY' ? f.weight > 0 : f.weight < 0))
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
    const labels = aligned.map(shortLabel).filter((l): l is string => l !== null).slice(0, 2);
    reason = labels.length > 0 ? labels.join(' + ') : `Skor komposit ${score >= 0 ? '+' : ''}${score}`;
  }

  return { signal, rsi, ma7, ma25, score, confidence, factors, reason };
}
