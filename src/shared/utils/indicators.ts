export type TradingSignal = 'BUY' | 'SELL' | 'HOLD';

export function computeMA(prices: number[], period: number): number[] {
  return prices.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
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

export interface SignalResult {
  signal: TradingSignal;
  rsi: number;
  ma7: number;
  ma25: number;
  reason: string;
}

export function computeSignal(closes: number[]): SignalResult {
  const rsiArr = computeRSI(closes, 14);
  const ma7Arr = computeMA(closes, 7);
  const ma25Arr = computeMA(closes, 25);

  const rsi = rsiArr[rsiArr.length - 1] ?? NaN;
  const ma7 = ma7Arr[ma7Arr.length - 1] ?? NaN;
  const ma25 = ma25Arr[ma25Arr.length - 1] ?? NaN;
  const ma7Prev = ma7Arr[ma7Arr.length - 2] ?? NaN;
  const ma25Prev = ma25Arr[ma25Arr.length - 2] ?? NaN;

  if (isNaN(rsi) || isNaN(ma7) || isNaN(ma25)) {
    return { signal: 'HOLD', rsi, ma7, ma25, reason: 'Data tidak cukup' };
  }

  const goldenCross = ma7Prev < ma25Prev && ma7 >= ma25;
  const deathCross = ma7Prev > ma25Prev && ma7 <= ma25;
  const oversold = rsi < 30;
  const overbought = rsi > 70;

  if ((oversold && ma7 >= ma25) || goldenCross) {
    const reasons: string[] = [];
    if (oversold) reasons.push(`RSI oversold (${rsi.toFixed(0)})`);
    if (goldenCross) reasons.push('Golden cross MA7/MA25');
    return { signal: 'BUY', rsi, ma7, ma25, reason: reasons.join(' + ') };
  }

  if ((overbought && ma7 <= ma25) || deathCross) {
    const reasons: string[] = [];
    if (overbought) reasons.push(`RSI overbought (${rsi.toFixed(0)})`);
    if (deathCross) reasons.push('Death cross MA7/MA25');
    return { signal: 'SELL', rsi, ma7, ma25, reason: reasons.join(' + ') };
  }

  const reason = `RSI ${rsi.toFixed(0)} · MA7 ${ma7 > ma25 ? '>' : '<'} MA25`;
  return { signal: 'HOLD', rsi, ma7, ma25, reason };
}
